const getRandomInt = max => Math.floor(Math.random() * max);

const getRandomFloatInRange = (min, max) => Math.random() * (max - min) + min;

module.exports = { getRandomInt, getRandomFloatInRange };
