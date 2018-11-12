import json
import os
from tools._data import get_data_path


class VideoSet:
    def __init__(self):
        self.path = os.path.join(get_data_path(), 'videos.json')

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


class VideoActionSequence:
    def __init__(self, actions):
        self.actions = actions

        self.last_action = -1
        self.last_timestamp = -1

        if len(self.actions) < 1:
            self.next_timestamp = float('inf')
            self.next_index = -1
        else:
            self.next_timestamp = self.actions[0][0]
            self.next_index = 0

    def get_action(self, timestamp):
        if timestamp < self.last_timestamp - 0.1:
            raise Exception()

        if timestamp < self.next_timestamp:
            return self.last_action
        else:
            while self.next_index < len(self.actions):
                if self.actions[self.next_index][0] <= timestamp:
                    self.last_action = self.actions[self.next_index][1]
                    self.next_index += 1
                else:
                    self.next_timestamp += 1
                    return self.last_action
            # the remaining actions will use the last action
            self.next_timestamp = float('inf')
            return self.last_action






