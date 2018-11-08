import cv2
import tflearn
import numpy as np
import tensorflow as tf

import collections

def get_frames():
    fps = 3 # targeting 5FPS
    vidcap = cv2.VideoCapture('data/IMG_0062.MOV')
    skip = round(vidcap.get(cv2.CAP_PROP_FPS)/fps)

    frames = list()
    frameid = -1
    count = 0
    while True:

        success, image = vidcap.read()
        if not success:
            break
        frameid += 1
        if frameid % skip == 0:
            image = cv2.resize(image, (int(640), int(360)))
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            cv2.imwrite("data/frame%d.jpg" % count, image)     # save frame as JPEG file
            frames.append(image)
            count += 1
    print(count)

    return frames


def get_network_wide(frames, input_size, num_classes):
    """Create a one-layer LSTM"""
    net = tflearn.input_data(shape=[None, frames, input_size])
    net = tflearn.lstm(net, 256, dropout=0.2)
    net = tflearn.fully_connected(net, num_classes, activation='softmax')
    net = tflearn.regression(net, optimizer='adam',
                             loss='categorical_crossentropy', name='output1')
    return net

if __name__ == '__main__':
    _frames = get_frames()
    num_frames = 5
    size = 0
    temp_list = collections.deque()
    X = []
    y = []

    for frame in _frames:
        frame = np.array(frame, np.float).ravel()
        size = len(frame)
        # Add to the queue.
        if len(temp_list) == num_frames - 1:
            temp_list.append(frame)
            X.append(np.array(list(temp_list)))
            y.append([0, 1])
            temp_list.popleft()
        else:
            temp_list.append(frame)
            continue

    _net = get_network_wide(num_frames, size, 2)

    model = tflearn.DNN(_net, tensorboard_verbose=0)
    model.fit(X, y, show_metric=True, batch_size=1, snapshot_step=100, n_epoch=4)

    # Save it.
    model.save('data/checkpoints/rnn.tflearn')