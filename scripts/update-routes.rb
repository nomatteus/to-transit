#!/usr/bin/env ruby

require 'net/http'
require 'uri'
require 'rexml/document'
require 'json'
require 'set'

TTC_ROUTES_URL = 'https://retro.umoiq.com/service/publicXMLFeed?command=routeList&a=ttc'
ROUTES_FILE = './routes.json'

# Direction mapping for all TTC routes - must be explicitly defined
DIRECTION_MAPPING = {
  # NorthSouth routes
  '7' => 'NorthSouth',   # Bathurst
  '8' => 'NorthSouth',   # Broadview
  '9' => 'NorthSouth',   # Bellamy
  '11' => 'NorthSouth',  # Bayview
  '13' => 'NorthSouth',  # Avenue Rd
  '16' => 'NorthSouth',  # McCowan
  '17' => 'NorthSouth',  # Birchmount
  '19' => 'NorthSouth',  # Bay
  '21' => 'NorthSouth',  # Brimley
  '22' => 'NorthSouth',  # Coxwell
  '23' => 'NorthSouth',  # Dawes
  '24' => 'NorthSouth',  # Victoria Park
  '25' => 'NorthSouth',  # Don Mills
  '29' => 'NorthSouth',  # Dufferin
  '31' => 'NorthSouth',  # Greenwood
  '33' => 'NorthSouth',  # Forest Hill
  '35' => 'NorthSouth',  # Jane
  '37' => 'NorthSouth',  # Islington
  '41' => 'NorthSouth',  # Keele
  '43' => 'NorthSouth',  # Kennedy
  '44' => 'NorthSouth',  # Kipling South
  '45' => 'NorthSouth',  # Kipling
  '46' => 'NorthSouth',  # Martin Grove
  '47' => 'NorthSouth',  # Lansdowne
  '51' => 'NorthSouth',  # Leslie
  '55' => 'NorthSouth',  # Warren Park
  '56' => 'NorthSouth',  # Leaside
  '57' => 'NorthSouth',  # Midland
  '61' => 'NorthSouth',  # Avenue Rd North
  '63' => 'NorthSouth',  # Ossington
  '64' => 'NorthSouth',  # Main
  '65' => 'NorthSouth',  # Parliament
  '66' => 'NorthSouth',  # Prince Edward
  '67' => 'NorthSouth',  # Pharmacy
  '68' => 'NorthSouth',  # Warden
  '69' => 'NorthSouth',  # Warden South
  '71' => 'NorthSouth',  # Runnymede
  '72' => 'NorthSouth',  # Pape
  '73' => 'NorthSouth',  # Royal York
  '74' => 'NorthSouth',  # Mount Pleasant
  '75' => 'NorthSouth',  # Sherbourne
  '76' => 'NorthSouth',  # Royal York South
  '77' => 'NorthSouth',  # Swansea
  '79' => 'NorthSouth',  # Scarlett Rd
  '83' => 'NorthSouth',  # Jones
  '89' => 'NorthSouth',  # Weston
  '90' => 'NorthSouth',  # Vaughan
  '91' => 'NorthSouth',  # Woodbine
  '92' => 'NorthSouth',  # Woodbine South
  '93' => 'NorthSouth',  # Parkview Hills
  '97' => 'NorthSouth',  # Yonge
  '99' => 'NorthSouth',  # Arrow Rd
  '100' => 'NorthSouth', # Flemingdon Park
  '102' => 'NorthSouth', # Markham Rd
  '104' => 'NorthSouth', # Faywood
  '105' => 'NorthSouth', # Dufferin North
  '106' => 'NorthSouth', # Sentinel
  '107' => 'NorthSouth', # York University Heights
  '109' => 'NorthSouth', # Ranee
  '110' => 'NorthSouth', # Islington South
  '111' => 'NorthSouth', # East Mall
  '112' => 'NorthSouth', # West Mall
  '117' => 'NorthSouth', # Birchmount South
  '119' => 'NorthSouth', # Torbarrie
  '123' => 'NorthSouth', # Sherway
  '126' => 'NorthSouth', # Christie
  '129' => 'NorthSouth', # McCowan North
  '130' => 'NorthSouth', # Middlefield
  '133' => 'NorthSouth', # Neilson
  '134' => 'NorthSouth', # Progress
  '160' => 'NorthSouth', # Bathurst North
  '167' => 'NorthSouth', # Pharmacy North
  '168' => 'NorthSouth', # Symington
  '171' => 'NorthSouth', # Mount Dennis
  '200' => 'NorthSouth', # Toronto Zoo
  '201' => 'NorthSouth', # Bluffer'S Park
  '302' => 'NorthSouth', # Kingston Rd-McCowan
  '307' => 'NorthSouth', # Bathurst
  '310' => 'NorthSouth', # Spadina
  '320' => 'NorthSouth', # Yonge
  '324' => 'NorthSouth', # Victoria Park
  '325' => 'NorthSouth', # Don Mills
  '329' => 'NorthSouth', # Dufferin
  '335' => 'NorthSouth', # Jane
  '337' => 'NorthSouth', # Islington
  '341' => 'NorthSouth', # Keele
  '343' => 'NorthSouth', # Kennedy
  '363' => 'NorthSouth', # Ossington
  '365' => 'NorthSouth', # Parliament
  '510' => 'NorthSouth', # Spadina
  '511' => 'NorthSouth', # Bathurst
  '900' => 'NorthSouth', # Airport Express
  '902' => 'NorthSouth', # Markham Rd Express
  '903' => 'NorthSouth', # Kennedy Stn-Scarborough Express
  '904' => 'NorthSouth', # Sheppard-Kennedy Express
  '924' => 'NorthSouth', # Victoria Park Express
  '925' => 'NorthSouth', # Don Mills Express
  '927' => 'NorthSouth', # Highway 27 Express
  '929' => 'NorthSouth', # Dufferin Express
  '935' => 'NorthSouth', # Jane Express
  '937' => 'NorthSouth', # Islington Express
  '941' => 'NorthSouth', # Keele Express
  '944' => 'NorthSouth', # Kipling South Express
  '945' => 'NorthSouth', # Kipling Express
  '968' => 'NorthSouth', # Warden Express
  '989' => 'NorthSouth', # Weston Express

  # EastWest routes
  '10' => 'EastWest',    # Van Horne
  '12' => 'EastWest',    # Kingston Rd
  '14' => 'EastWest',    # Glencairn
  '15' => 'EastWest',    # Evans
  '20' => 'EastWest',    # Cliffside
  '26' => 'EastWest',    # Dupont
  '28' => 'EastWest',    # Bayview South
  '30' => 'EastWest',    # High Park North
  '32' => 'EastWest',    # Eglinton West
  '34' => 'EastWest',    # Eglinton East
  '36' => 'EastWest',    # Finch West
  '38' => 'EastWest',    # Highland Creek
  '39' => 'EastWest',    # Finch East
  '40' => 'EastWest',    # Junction-Dundas West
  '42' => 'EastWest',    # Cummer
  '48' => 'EastWest',    # Rathburn
  '49' => 'EastWest',    # Bloor West
  '50' => 'EastWest',    # Burnhamthorpe
  '52' => 'EastWest',    # Lawrence West
  '53' => 'EastWest',    # Steeles East
  '54' => 'EastWest',    # Lawrence East
  '59' => 'EastWest',    # Maple Leaf
  '60' => 'EastWest',    # Steeles West
  '62' => 'EastWest',    # Mortimer
  '70' => 'EastWest',    # O'Connor
  '78' => 'EastWest',    # St Andrews
  '80' => 'EastWest',    # Queensway
  '82' => 'EastWest',    # Rosedale
  '84' => 'EastWest',    # Sheppard West
  '85' => 'EastWest',    # Sheppard East
  '86' => 'EastWest',    # Scarborough
  '87' => 'EastWest',    # Cosburn
  '88' => 'EastWest',    # South Leaside
  '94' => 'EastWest',    # Wellesley
  '95' => 'EastWest',    # York Mills
  '96' => 'EastWest',    # Wilson
  '98' => 'EastWest',    # Willowdale-Senlac
  '101' => 'EastWest',   # Downsview Park
  '108' => 'EastWest',   # Driftwood
  '113' => 'EastWest',   # Danforth
  '114' => 'EastWest',   # Queens Quay East
  '115' => 'EastWest',   # Silver Hills
  '116' => 'EastWest',   # Morningside
  '118' => 'EastWest',   # Thistle Down
  '120' => 'EastWest',   # Calvington
  '121' => 'EastWest',   # Esplanade-River
  '122' => 'EastWest',   # Graydon Hall
  '124' => 'EastWest',   # Sunnybrook
  '125' => 'EastWest',   # Drewry
  '127' => 'EastWest',   # Davenport
  '128' => 'EastWest',   # Stanley Greene
  '131' => 'EastWest',   # Nugget
  '132' => 'EastWest',   # Milner
  '135' => 'EastWest',   # Gerrard
  '149' => 'EastWest',   # Etobicoke-Bloor
  '154' => 'EastWest',   # Curran Hall
  '161' => 'EastWest',   # Rogers Rd
  '162' => 'EastWest',   # Lawrence-Donway
  '165' => 'EastWest',   # Weston Rd North
  '169' => 'EastWest',   # Huntingwood
  '184' => 'EastWest',   # Ancaster Park
  '185' => 'EastWest',   # Sheppard Central
  '189' => 'EastWest',   # Stockyards
  '202' => 'EastWest',   # Cherry Beach
  '300' => 'EastWest',   # Bloor-Danforth
  '301' => 'EastWest',   # Queen
  '304' => 'EastWest',   # King
  '305' => 'EastWest',   # Dundas
  '306' => 'EastWest',   # Carlton
  '312' => 'EastWest',   # St Clair
  '315' => 'EastWest',   # Evans-Brown's Line
  '322' => 'EastWest',   # Coxwell
  '332' => 'EastWest',   # Eglinton West
  '334' => 'EastWest',   # Eglinton East
  '336' => 'EastWest',   # Finch West
  '339' => 'EastWest',   # Finch East
  '340' => 'EastWest',   # Junction
  '352' => 'EastWest',   # Lawrence West
  '353' => 'EastWest',   # Steeles
  '354' => 'EastWest',   # Lawrence East
  '384' => 'EastWest',   # Sheppard West
  '385' => 'EastWest',   # Sheppard East
  '395' => 'EastWest',   # York Mills
  '396' => 'EastWest',   # Wilson
  '501' => 'EastWest',   # Queen
  '503' => 'EastWest',   # Kingston Rd
  '504' => 'EastWest',   # King
  '505' => 'EastWest',   # Dundas
  '506' => 'EastWest',   # Carlton
  '507' => 'EastWest',   # Long Branch
  '509' => 'EastWest',   # Harbourfront
  '512' => 'EastWest',   # St Clair
  '905' => 'EastWest',   # Eglinton East Express
  '939' => 'EastWest',   # Finch Express
  '952' => 'EastWest',   # Lawrence West Express
  '953' => 'EastWest',   # Steeles East Express
  '954' => 'EastWest',   # Lawrence East Express
  '960' => 'EastWest',   # Steeles West Express
  '984' => 'EastWest',   # Sheppard West Express
  '985' => 'EastWest',   # Sheppard East Express
  '986' => 'EastWest',   # Scarborough Express
  '995' => 'EastWest',   # York Mills Express
  '996' => 'EastWest'    # Wilson Express
}.freeze

# Name replacement patterns to fix issues with the XML feed
NAME_REPLACEMENTS = [
  ["'S", "'s"]  # Fix apostrophe capitalization (e.g., "Bluffer'S Park" -> "Bluffer's Park")
].freeze

def get_route_type(tag)
  tag_num = tag.to_i
  
  # Streetcars
  if (501..512).include?(tag_num) || %w[301 304 305 306 310 312].include?(tag)
    'streetcar'
  else
    'bus'
  end
end

def get_route_direction(tag)
  direction = DIRECTION_MAPPING[tag]
  
  unless direction
    raise "Direction not defined for route #{tag}. Please add it to DIRECTION_MAPPING in the script.\n" \
          "Check the route details at: https://www.ttc.ca/routes-and-schedules/#{tag}"
  end
  
  direction
end

def clean_route_name(title, tag)
  # Remove the route number prefix (e.g., "7-Bathurst" -> "Bathurst")
  name = title.gsub(/^\d+-/, '')
  
  # Apply replacement patterns
  NAME_REPLACEMENTS.each do |pattern, replacement|
    name = name.gsub(pattern, replacement)
  end
  
  name
end

def fetch_xml(url)
  uri = URI(url)
  response = Net::HTTP.get_response(uri)
  
  unless response.is_a?(Net::HTTPSuccess)
    raise "Failed to fetch XML: #{response.code} #{response.message}"
  end
  
  response.body
end

def parse_xml_routes(xml_data)
  doc = REXML::Document.new(xml_data)
  routes = []
  
  doc.elements.each('body/route') do |route|
    tag = route.attributes['tag']
    title = route.attributes['title']
    
    if tag && title
      routes << {
        'tag' => tag,
        'type' => get_route_type(tag),
        'direction' => get_route_direction(tag),
        'name' => clean_route_name(title, tag)
      }
    end
  end
  
  # Sort routes by tag number for consistent ordering
  routes.sort_by! { |route| route['tag'].to_i }
  
  routes
end

def update_routes_file
  puts 'Fetching routes from TTC XML feed...'
  xml_data = fetch_xml(TTC_ROUTES_URL)
  
  puts 'Parsing XML data...'
  new_routes = parse_xml_routes(xml_data)
  
  puts "Found #{new_routes.length} routes"
  
  # Check if routes.json exists and compare
  if File.exist?(ROUTES_FILE)
    existing_data = JSON.parse(File.read(ROUTES_FILE))
    existing_routes = existing_data['routes'] || []
    
    existing_tags = existing_routes.map { |route| route['tag'] }.to_set
    new_tags = new_routes.map { |route| route['tag'] }.to_set
    
    removed_tags = existing_tags - new_tags
    
    unless removed_tags.empty?
      puts "\nWarning: The following routes are missing from the XML feed:"
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
        # Keep existing routes that are missing from XML feed
        missing_routes = existing_routes.select { |route| removed_tags.include?(route['tag']) }
        new_routes += missing_routes
        puts "Keeping #{missing_routes.length} existing routes that are missing from XML feed"
      when 'r', 'remove'
        puts "Will remove #{removed_tags.length} routes that are missing from XML feed"
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