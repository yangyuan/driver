import json


class Data:
    def __init__(self, path):
        self.path = path

    def _read_data(self):
        with open(self.path, 'r') as f:
            return json.loads(f.read())

    def _write_data(self, data):
        with open(self.path, 'w') as f:
            f.write(json.dumps(data, sort_keys=True, indent=2))

    def get_videos(self):
        return self._read_data()

    def update_video(self, video):
        videos = self._read_data()
        videos_ref = dict()
        for _video in videos:
            videos_ref[_video['name']] = _video
        videos_ref[video['name']] = video
        self._write_data(list(videos_ref.values()))
