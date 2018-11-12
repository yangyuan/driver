import tensorflow as tf


class LeNet5:
    def __init__(self, _num_labels=10, initializer_mean=0, initializer_stddev=0.3, learning_rate=0.001, original=False):

        self.parameters['mean'] = initializer_mean
        self.parameters['stddev'] = initializer_stddev

        self.specification['shape_input'] = (32, 32, 1)
        self.specification['shape_output'] = (_num_labels,)

        self.x = tf.placeholder(tf.float32, shape=(None,) + self.specification['shape_input'])
        self.y = tf.placeholder(tf.int32, shape=(None,) + self.specification['shape_output'])

        model = tf.keras.Sequential()
        model.add(tf.keras.layers.LSTM(units=256, dropout=0.2))
        model.add(tf.keras.layers.Dense(10, activation='softmax'))

        model.compile(optimizer=tf.train.AdamOptimizer(),
                      loss='categorical_crossentropy',
                      metrics=['accuracy'])

        # Loss and metrics
        self.cross_entropy = tf.nn.softmax_cross_entropy_with_logits_v2(logits=self.logits, labels=self.y)
        self.loss_op = tf.reduce_mean(self.cross_entropy)
        self.optimizer = tf.train.AdamOptimizer(learning_rate=learning_rate)
        self.training_step = self.optimizer.minimize(self.loss_op)

        self.correct_prediction = tf.equal(tf.argmax(self.logits, 1), tf.argmax(self.y, 1))
        self.accuracy_operation = tf.reduce_mean(tf.cast(self.correct_prediction, tf.float32))
        self.saver = tf.train.Saver()

    def common_train(self, data, epochs, batch_size, session):
        for x, y in MinBatch((data.training_x, data.training_y), batch_size):
            print(x.shape)
            print(y.shape)


    def train(self, data, epochs, batch_size, auto_save=True):
        self.common_train(data, epochs, batch_size, None)

        assert (epochs > 0 and batch_size > 0)

        num_examples = len(data.training_x)

        Logger.log('Training the model . . .')

        """
        dataset = data.get_training()
        dataset = dataset.shuffle(buffer_size=batch_size*8)
        dataset = dataset.batch(batch_size)
        """

        with tf.Session() as session:
            session.run(tf.global_variables_initializer())
            for epoch in range(epochs):
                num_batches = int((num_examples-1)/batch_size) + 1
                i = 0
                for x_batch, y_batch in MinBatch((data.training_x, data.training_y), batch_size):
                    i += 1
                    _, acc, cross = session.run([self.training_step, self.accuracy_operation, self.cross_entropy],
                                                feed_dict={self.x: x_batch, self.y: y_batch})
                    print(i, num_batches, acc)

                """
                train_data, train_labels = data.training_x, data.training_y
                num_batches = int((num_examples-1)/batch_size) + 1
                i = 0
                for offset in range(0, num_examples, batch_size):
                    i += 1
                    end = offset + batch_size
                    x_batch, y_batch = train_data[offset:end], train_labels[offset:end]

                    _, acc, cross = session.run([self.training_step, self.accuracy_operation, self.cross_entropy],
                                                feed_dict={self.x: x_batch, self.y: y_batch})
                    print(i, num_batches, acc)

                num_batches = int((num_examples-1)/batch_size) + 1

                iterator = dataset.make_one_shot_iterator()
                next_element = iterator.get_next()
                for i in range(num_batches):
                    _x, _y = session.run(next_element)

                    _, acc, cross = session.run([self.training_step, self.accuracy_operation, self.cross_entropy],
                                                feed_dict={self.x: _x, self.y: _y})
                    print(i, num_batches, acc)
                """

                validation_accuracy = self.evaluate(data.validation_x, data.validation_y, batch_size)
                Logger.log("Epoch {} - validation accuracy {:.3f} ".format(epoch + 1, validation_accuracy))

                if auto_save and (epoch % 10 == 0):
                    save_path = self.saver.save(session, 'data/checkpoints/model.ckpt'.format(epoch))

            test_accuracy = self.evaluate(self.test_data, self.test_labels, batch_size=batch_size)
            return test_accuracy

    def evaluate(self, X_data, y_data, batch_size):
        num_examples = len(X_data)
        total_accuracy = 0
        sess = tf.get_default_session()
        for offset in range(0, num_examples, batch_size):
            batch_x, batch_y = X_data[offset:offset + batch_size], y_data[offset:offset + batch_size]
            accuracy = sess.run(self.accuracy_operation, feed_dict={self.x: batch_x, self.y: batch_y})
            total_accuracy += (accuracy * len(batch_x))
        return total_accuracy / num_examples

    def restore_model(self, path):
        with tf.Session() as session:
            self.saver.restore(sess=session, save_path=path)