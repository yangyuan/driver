import json
from flask import Flask, send_from_directory, jsonify, request

from tools import VideoSet


app = Flask(__name__, static_folder='www')
video_set = VideoSet()


@app.route('/<path:path>')
def send_js(path):
    return send_from_directory(app.static_folder, path)


@app.route('/data/<path:path>')
def send_video(path):
    return send_from_directory('data', path)


@app.after_request
def add_header(r):
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


@app.route('/api/videos/<path:videoId>', methods=['PUT'])
def update(videoId):
    print(videoId)
    video = json.loads(request.data.decode())
    video_set.update_video(video)
    return jsonify(video)


@app.route("/api/videos")
def hello():
    return jsonify(video_set.get_videos())


if __name__ == '__main__':
    app.run(debug=True)
