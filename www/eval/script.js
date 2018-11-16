import * as tf from '@tensorflow/tfjs';

const MODEL_URL = '../../data/web_model/tensorflowjs_model.pb';
const WEIGHTS_URL = '../../data/web_model/weights_manifest.json';

const model = await tf.loadFrozenModel(MODEL_URL, WEIGHTS_URL);
const cat = document.getElementById('cat');
model.execute({input: tf.fromPixels(cat)});