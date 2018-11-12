from tools.dataset import DataSet
import tflearn
import numpy as np


def get_network_wide(frames, input_size, num_classes):
    """Create a one-layer LSTM"""
    net = tflearn.input_data(shape=[None, frames, input_size])
    net = tflearn.lstm(net, 128, dropout=0.2)
    net = tflearn.fully_connected(net, num_classes, activation='softmax')
    net = tflearn.regression(net, optimizer='adam',
                             loss='categorical_crossentropy', name='output1')
    return net


if __name__ == '__main__':

    data = DataSet(width=160, height=90)
    # data.load()
    # data.dump_cache()
    data.load_cache()
    # data.to_sequence_trunks()
    _net = get_network_wide(15, data.frame_size, data.class_number)
    model = tflearn.DNN(_net, tensorboard_verbose=0)

    model.save('data/checkpoints/lstm.128.160.90.tflearn')

    for i in range(20):
        for frames, actions in data.data:
            x, y = data._to_sequence_trunks(frames, actions)

            x = np.array(x)
            y = np.array(y)

            random_order = np.arange(len(x))
            np.random.shuffle(random_order)
            _x, _y = x[random_order], y[random_order]

            #exit()
            model.fit(_x, _y, show_metric=True, batch_size=3, snapshot_step=100, n_epoch=1)
            model.save('data/checkpoints/lstm.128.160.90.tflearn')

            labels = model.predict_label(x)
            print([x[0] for x in labels])
            print(list(np.argmax(y, axis=1)))
