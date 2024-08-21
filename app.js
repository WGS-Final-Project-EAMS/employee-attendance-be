const express = require('express');
var morgan = require('morgan');

const app = express();
const port = 8080;

// Morgan
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send('Express JS Ready');
})

app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}/`);
})