import os
import json
from flask import Flask, send_from_directory, jsonify, request

from data import Data


app = Flask(__name__, static_folder='')
data = Data(os.path.join(app.root_path, 'data.json'))


@app.route('/<path:path>')
def send_js(path):
    return send_from_directory(app.static_folder, path)


@app.route('/data/<path:path>')
def send_video(path):
    return send_from_directory(os.path.join(app.root_path, '..', 'data'), path)



@app.route('/api/videos/<string:videoId>', methods=['PUT'])
def update(videoId):
    video = json.loads(request.data.decode())
    data.update_video(video)
    return jsonify(video)


@app.route("/api/videos")
def hello():
    return jsonify(data.get_videos())


if __name__ == '__main__':
    app.run(debug=True)
