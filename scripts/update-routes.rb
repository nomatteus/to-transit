#!/usr/bin/env ruby

require 'net/http'
require 'uri'
require 'json'
require 'csv'
require 'tmpdir'
require 'set'

GTFS_ZIP_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/bd4809dd-e289-4de8-bbde-c5c00dafbf4f/resource/28514055-d011-4ed7-8bb0-97961dfe2b66/download/SurfaceGTFS.zip'
ROUTES_FILE = './routes.json'

def download_file(url, dest)
  uri = URI(url)
  Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
    request = Net::HTTP::Get.new(uri)
    response = http.request(request)

    # Follow redirects
    if response.is_a?(Net::HTTPRedirection)
      return download_file(response['location'], dest)
    end

    unless response.is_a?(Net::HTTPSuccess)
      raise "Failed to download: #{response.code} #{response.message}"
    end

    File.binwrite(dest, response.body)
  end
end

def parse_route_directions(trips_csv)
  direction_map = {}

  CSV.parse(trips_csv, headers: true) do |row|
    route_id = row['route_id']
    headsign = row['trip_headsign']&.strip
    next if route_id.nil? || headsign.nil?
    next if direction_map.key?(route_id)

    first_word = headsign.split(/\s+/).first&.downcase
    next if first_word.nil?
    next if %w[not terminal].include?(first_word)

    case first_word
    when 'north', 'south'
      direction_map[route_id] = 'NorthSouth'
    when 'east', 'west'
      direction_map[route_id] = 'EastWest'
    end
  end

  direction_map
end

def parse_gtfs_routes(tmpdir)
  zip_path = File.join(tmpdir, 'gtfs.zip')

  puts 'Downloading GTFS data...'
  download_file(GTFS_ZIP_URL, zip_path)

  puts 'Extracting routes.txt and trips.txt...'
  system('unzip', '-o', '-q', zip_path, 'routes.txt', 'trips.txt', '-d', tmpdir) or raise 'Failed to extract GTFS files'

  routes_csv = File.read(File.join(tmpdir, 'routes.txt'))
  trips_csv = File.read(File.join(tmpdir, 'trips.txt'))

  puts 'Parsing trip directions...'
  direction_map = parse_route_directions(trips_csv)

  puts 'Parsing routes...'
  routes = []
  missing_direction = []

  CSV.parse(routes_csv, headers: true) do |row|
    tag = row['route_short_name']
    name = row['route_long_name']
    route_type = row['route_type']&.to_i
    route_id = row['route_id']
    next if tag.nil? || name.nil?

    type = route_type == 0 ? 'streetcar' : 'bus'
    direction = direction_map[route_id]

    if direction.nil?
      missing_direction << tag
      next
    end

    routes << {
      'tag' => tag,
      'type' => type,
      'direction' => direction,
      'name' => name
    }
  end

  unless missing_direction.empty?
    puts "\nWarning: Could not determine direction for routes: #{missing_direction.sort_by(&:to_i).join(', ')}"
    puts '(These routes only have "Not In Service" or "Terminal" headsigns)'
  end

  routes.sort_by! { |route| route['tag'].to_i }
  routes
end

def update_routes_file
  new_routes = Dir.mktmpdir do |tmpdir|
    parse_gtfs_routes(tmpdir)
  end

  puts "Found #{new_routes.length} routes"

  # Check if routes.json exists and compare
  if File.exist?(ROUTES_FILE)
    existing_data = JSON.parse(File.read(ROUTES_FILE))
    existing_routes = existing_data['routes'] || []

    existing_tags = existing_routes.map { |route| route['tag'] }.to_set
    new_tags = new_routes.map { |route| route['tag'] }.to_set

    removed_tags = existing_tags - new_tags

    unless removed_tags.empty?
      puts "\nWarning: The following routes are missing from the GTFS feed:"
      removed_tags.sort_by(&:to_i).each do |tag|
        removed_route = existing_routes.find { |route| route['tag'] == tag }
        puts "  - Route #{tag}: #{removed_route['name']} (#{removed_route['type']})"
      end

      puts "\nOptions:"
      puts "  k) Keep existing routes and update others"
      puts "  r) Remove missing routes and update"
      puts "  c) Cancel update"
      print "Choose (k/r/c): "
      response = STDIN.gets.chomp.downcase

      case response
      when 'k', 'keep'
        missing_routes = existing_routes.select { |route| removed_tags.include?(route['tag']) }
        new_routes += missing_routes
        puts "Keeping #{missing_routes.length} existing routes that are missing from GTFS feed"
      when 'r', 'remove'
        puts "Will remove #{removed_tags.length} routes that are missing from GTFS feed"
      when 'c', 'cancel'
        puts "Update cancelled."
        return
      else
        puts "Invalid option. Update cancelled."
        return
      end
    end
  end

  # Sort the final routes list
  new_routes.sort_by! { |route| route['tag'].to_i }

  routes_json = {
    'routes' => new_routes
  }

  puts 'Writing updated routes.json...'
  File.write(ROUTES_FILE, JSON.pretty_generate(routes_json))

  puts 'Routes file updated successfully!'
  puts "Updated with #{new_routes.length} routes"

rescue => error
  puts "Error updating routes: #{error}"
  exit(1)
end

# Run the update if this script is executed directly
if __FILE__ == $0
  update_routes_file
end
