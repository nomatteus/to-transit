require 'clockwork'

include Clockwork

handler do |job|
  puts "Running #{job}"
  `#{job}`
end

every(10.seconds, 'curl -s http://localhost:4567/xml'); # > /dev/null')