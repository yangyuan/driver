import os
import math
import pickle
from collections import deque

import cv2
import numpy as np

from tools.video import VideoSet, VideoActionSequence
from tools._data import get_data_path


class DataSet:
    def __init__(self, fps=5, width=320, height=180, trunk_size=50, class_number=10, verbose=False):
        self.fps = fps
        self.trunk_size = trunk_size
        self.width = width
        self.height = height
        self.frame_size = width*height
        self.class_number = class_number
        self.verbose = verbose

        self.data = []

    def load(self):
        _data_path = get_data_path()

        for video in VideoSet().get_videos():
            if video['status'] != 1:
                print('ignore: ', video['name'])
                continue

            _video_path = os.path.join(_data_path, video['name'])
            print('extract: ', video['name'])
            frames, actions = self._extract_frames(_video_path, VideoActionSequence(video['speeds']))
            self.data.append((frames, actions))

    def dump_cache(self):
        with open(os.path.join(get_data_path(), 'videos.%d.%d.1.pkl' % (self.width, self.height)), 'wb') as f:
            pickle.dump(self.data, f, protocol=pickle.HIGHEST_PROTOCOL)

    def load_cache(self):
        with open(os.path.join(get_data_path(), 'videos.%d.%d.1.pkl' % (self.width, self.height)), 'rb') as f:
            self.data = pickle.load(f)

    def _extract_frames(self, video_path, video_actions):

        capture = cv2.VideoCapture(video_path)
        raw_fps = capture.get(cv2.CAP_PROP_FPS)
        skip = round(raw_fps / self.fps)
        frame_count = capture.get(cv2.CAP_PROP_FRAME_COUNT)

        frames = list()
        actions = list()
        raw_frame_index = -1
        frame_index = 0
        while True:
            success, image = capture.read()
            if not success:
                break
            raw_frame_index += 1
            if raw_frame_index % skip == 0:

                image = cv2.resize(image, (self.height, self.width))
                image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                timestamp = raw_frame_index / raw_fps
                action = video_actions.get_action(timestamp)
                if self.verbose:
                    # save frame as JPEG file
                    folder = video_path + ".frames"
                    if not os.path.exists(folder):
                        os.mkdir(folder)
                    cv2.imwrite(os.path.join(folder, "%04d.jpg" % frame_index), image)
                print(raw_frame_index, '/', int(frame_count), ':', math.floor(timestamp*10)/10, action)
                frames.append(image)
                actions.append(action)
                frame_index += 1
        print(frame_index, 'frame captured.')

        return frames, actions

    def _to_sequence_trunks(self, frames, actions, keep_dim=False):
        temp_x = deque()
        x = []
        y = []

        for frame, action in zip(frames, actions):
            if keep_dim:
                frame = np.array(frame, np.float).reshape(self.height, self.width, 1)
            else:
                frame = np.array(frame, np.float).ravel()
            # Add to the queue.
            if len(temp_x) == self.trunk_size - 1:
                temp_x.append(frame)
                x.append(np.array(list(temp_x)))
                temp_y = action
                y.append(temp_y)
                temp_x.popleft()
            else:
                temp_x.append(frame)
                continue
        return x, y

    def to_sequence_trunks(self):
        for frames, actions in self.data:
            print(self._to_sequence_trunks(frames, actions))

    def to_sequence_frames(self, batch_size=1):
        for frames, actions in self.data:
            for frame, action in zip(frames, actions):
                frame = np.array(frame, np.float).reshape(320, 180, 1)
                label = action
                yield np.array([frame]), np.array([label])
