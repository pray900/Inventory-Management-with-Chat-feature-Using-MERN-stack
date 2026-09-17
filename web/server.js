import express from 'express';
import path from 'path';

const app = express();

app.use(express.static(path.join(process.cwd(), 'dist')));

app.get('/*', function (req, res) {
    res.sendFile(path.join(process.cwd(), 'dist/index.html'))
})

app.listen(process.env.PORT || 8080, function () {
    console.log('server is ready')
})
