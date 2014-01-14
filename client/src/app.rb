require 'sinatra'
require 'pusher'
require 'json'

Pusher.app_id = ENV['PUSHER_APP_ID']
Pusher.key = ENV['PUSHER_APP_KEY']
Pusher.secret = ENV['PUSHER_APP_SECRET']

set :public_folder, Proc.new { File.join(root, "public") }

configure :production, :development do
    enable :logging
end

helpers do

  def protected!
    unless authorized?
      response['WWW-Authenticate'] = %(Basic realm="Restricted Area")
      throw(:halt, [401, "Not authorized\n"])
    end
  end

  def authorized?
    @auth ||=  Rack::Auth::Basic::Request.new(request.env)
    @auth.provided? && @auth.basic? && @auth.credentials && @auth.credentials == [ ENV['ADMIN_USER'], ENV['ADMIN_PWD'] ]
  end

end

get '/' do
	# logger.info ENV['USER']
  # logger.info ENV['PWD']

	protected!

  send_file File.join(settings.public_folder, 'index.html')
end

post '/pusher/auth' do
	protected!

  auth = Pusher[ params[ 'channel_name' ] ].authenticate( params[ 'socket_id' ] )
  
  content_type "application/json"
	auth.to_json
end