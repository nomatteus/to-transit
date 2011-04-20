require 'sinatra'
require 'mongo'
require 'sinatra/mongo'

require 'nokogiri'
require 'open-uri'

set :mongo, 'mongo://localhost:27017/test'

get '/' do
	"hello"
	connection = Mongo::Connection.new
	connection.database_names.inspect
	connection.database_names.each do |name| 
		puts name
	end
	output = ""
	connection.database_info.each do |info| 
		output << "#{info.inspect} <br>"
	end
	output
end


get '/xml' do
	output = ""
	#doc = Nokogiri::HTML(open('test-data.xml'))
	doc = Nokogiri::HTML(open('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=0'))

	time_updated = doc.xpath("//lasttime")[0]['time']

	doc.xpath("//vehicle").each do |vehicle|
		streetcar = {}

		streetcar['id'] = vehicle[:id].to_i
		streetcar['route'] = vehicle[:routetag].to_i 

		# dirtag is in format 510_1_510A
		streetcar['dir_tag'] = vehicle[:dirtag] 
		dirtag_parts = vehicle['dirtag'].to_s.split('_')

		# direction is given as a 1 or 0. convert to n/s/e/w depending on route
		streetcar['dir'] = case streetcar['route'].to_i
				when 510, 511 
					(dirtag_parts[1] == '1' && 'N') || (dirtag_parts[1] == '0' && 'S') || nil
				else  
					(dirtag_parts[1] == '1' && 'W') || (dirtag_parts[1] == '0' && 'E') || nil
				end

		# 'sub'-route (i.e. 510A or 'con'), need to figure out what this means
		streetcar['route_sub'] = dirtag_parts[2] 
		streetcar['lat'] = vehicle[:lat].to_f 
		streetcar['lng'] = vehicle[:lon].to_f
		streetcar['heading'] = vehicle[:heading].to_i
		streetcar['secs_since_report']= vehicle[:secssincereport].to_i
		streetcar['trip_tag']= vehicle[:triptag].to_i
		#output << "#{vehicle[:id]} <br>"
		#output << "#{vehicle[:routetag]} <br>"
		#output << "#{vehicle[:dirtag].to_s.split('_').inspect} <br>"
		#output << "#{vehicle[:triptag]} <br>"
		#output << "#{vehicle[:lat]} <br>"
		#output << "#{vehicle[:lon]} <br>"
		#output << "#{vehicle[:secssincereport]} <br>"
		#output << "#{vehicle[:predictable]} <br>"
		#output << "#{vehicle[:heading]} <br>"
		#output << "#{vehicle[:speedkmhr]} <br>"
		streetcar['time_updated'] = time_updated;
		output << streetcar.inspect
		puts mongo['test'].insert streetcar
	end

	output	
end
