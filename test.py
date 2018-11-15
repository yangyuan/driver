from tools.dataset import DataSet
import tflearn
import numpy as np


def get_network_wide(frames, height, width):
    """Create a one-layer LSTM"""
    net = tflearn.input_data(shape=[None, frames, height, width, 1])
    net = tflearn.reshape(net, [-1, height, width, 1])
    # (?, 18, 32, 8)
    net = tflearn.conv_2d(net, 8, [20, 20], 5, activation='relu')
    # (?, 6, 8, 16)
    net = tflearn.conv_2d(net, 16, [6, 8], [3, 4], activation='relu')
    # 768
    net = tflearn.reshape(net, [-1, frames, 8*6*16])
    # 128
    net = tflearn.lstm(net, 128, dropout=0.2)
    # 10
    net = tflearn.fully_connected(net, 1, activation='relu')
    net = tflearn.regression(net, optimizer='adam', learning_rate=0.0005,
                             loss='mean_square', name='output1')
    return net


if __name__ == '__main__':

    data = DataSet(width=160, height=90)
    # data.load()
    # data.dump_cache()
    data.load_cache()
    # data.to_sequence_trunks()
    _net = get_network_wide(50, data.height, data.width)
    model = tflearn.DNN(_net, tensorboard_verbose=0)

    # model.save('data/checkpoints/lstm.128.160.90.tflearn')

    for i in range(100):
        for frames, actions in data.data:
            x, y = data._to_sequence_trunks(frames, actions, True)

            x = np.array(x)
            y = np.array(y)

            random_order = np.arange(len(x))
            np.random.shuffle(random_order)
            _x, _y = x[random_order], y[random_order]

            #exit()
            model.fit(_x, _y, show_metric=True, batch_size=3, snapshot_step=100, n_epoch=1)
            model.save('data/checkpoints/lstm.128.160.90.tflearn')

            labels = model.predict_label(x[:100])
            print([x[0] for x in labels])
            print(y[:100])
