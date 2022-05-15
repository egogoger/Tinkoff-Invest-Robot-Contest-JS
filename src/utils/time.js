const nextWeek = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
};

module.exports = { nextWeek };
