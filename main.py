import tensorflow as tf
from tools.dataset import DataSet
from collections import deque

data = DataSet()
# data.load()
# data.dump_cache()
data.load_cache()


# data.to_sequence_trunks()


def lstm(units, x):
    cell = tf.contrib.rnn.LSTMCell(256)
    state = tf.Variable(cell.zero_state(1, tf.float32), trainable=False)
    outputs, states = tf.nn.dynamic_rnn(cell, x, dtype=tf.float32)
    # x = tf.unstack(x, 15, 1)
    # outputs, states = tf.contrib.rnn.static_rnn(cell, x, dtype=tf.float32)

    return outputs[-1], states[-1]


my_graph = tf.Graph()
with my_graph.as_default():
    print(my_graph.name_scope)
    x = tf.placeholder(tf.float32, shape=(None, 320, 180, 1))
    y = tf.placeholder(tf.float32, shape=(None, 10))
    # xxx = tf.keras.layers.LSTM(256, implementation=2)(x)

    # C3
    # In: (320, 180, 1), Out: (32, 18, 16)
    c3_kernel = tf.get_variable(
        'c3_kernel',
        shape=[20, 20, 1, 16],
        initializer=tf.truncated_normal_initializer(stddev=0.3))
    c3_bias = tf.get_variable(
        'c3_bias',
        shape=[16],
        initializer=tf.random_normal_initializer(stddev=0.3))
    c3 = tf.nn.conv2d(x, c3_kernel, [1, 10, 10, 1], padding='SAME') + c3_bias

    flattened = tf.reshape(c3, (-1, 1, 9216))  # (32, 18, 16) to (9216, )

    xxx, _1 = lstm(128, flattened)
    logits = tf.keras.layers.Dense(10)(xxx)

    cross_entropy = tf.nn.softmax_cross_entropy_with_logits_v2(logits=logits, labels=y)
    loss_op = tf.reduce_mean(cross_entropy)
    optimizer = tf.train.AdamOptimizer()
    training_step = optimizer.minimize(loss_op)
    correct_prediction = tf.equal(tf.argmax(logits, 1), tf.argmax(y, 1))
    accuracy_operation = tf.reduce_mean(tf.cast(correct_prediction, tf.float32))
    saver = tf.train.Saver()

    print(x)
    print(logits)

    accs = deque()
    count = 0
    with tf.Session() as session:
        for _x, _y in data.to_sequence_frames():
            session.run(tf.global_variables_initializer())
            _, acc, cross, _log, __1 = session.run([training_step, accuracy_operation, cross_entropy, xxx, _1],
                                                   feed_dict={x: _x, y: _y})

            accs.append(acc)
            if len(accs) > 20:
                accs.popleft()
            print(count, sum(accs)/len(accs))
            count += 1

            if count % 100 == 0:
                saver.save(session, 'data/checkpoints/new.ckpt')

    tf.saved_model.simple_save(
        session,
        'data/saved_model3',
        inputs={'x': x},
        outputs={'logits': logits}
    )

"""
tf.saved_model.simple_save(
    session,
    'data/saved_model3',
    inputs={'x': x},
    outputs={'logits': logits}
)
"""
