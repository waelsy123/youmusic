const readline = require('readline');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
var search = require('youtube-search');
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;


var opts = {
    maxResults: 10,
    key: 'AIzaSyC9ja9MxgEmHH2k_n3LbaayJ8VHhLqonAk'
};


app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.render('home')
});

app.get('/search', (req, res) => {
    const { search_query } = req.query;

    search(search_query, opts, function (err, results) {
        if (err) return console.log(err);

        console.dir(results);
        res.render('results', {
            list: results.filter(item => item.kind === 'youtube#video')
        });
    });
});

app.get('/watch', (req, res) => {
    const id = req.query.v;
    let audio = ytdl(id, {
        quality: 'highestaudio',
        filter: 'audioonly',
    });

    const output = path.resolve(__dirname, `${id}.mp3`);

    if (fs.existsSync(output)) {
        const stat = fs.statSync(output);
        const rstream = fs.createReadStream(output);
        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size

        });
        rstream.pipe(res);
    }
    else {
        let starttime;
        audio.pipe(fs.createWriteStream(output));
        res.writeHead(200, {
            'Content-Type': 'audio/mpeg'

        });
        audio.pipe(res);
        audio.once('response', () => {
            starttime = Date.now();
        });
        audio.on('progress', (chunkLength, downloaded, total) => {
            const floatDownloaded = downloaded / total;
            const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${(floatDownloaded * 100).toFixed(2)}% downloaded`);
            process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
            process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
            process.stdout.write(`, estimated time left: ${(downloadedMinutes / floatDownloaded - downloadedMinutes).toFixed(2)}minutes `);
            readline.moveCursor(process.stdout, 0, -1);
        });
        audio.on('end', () => {
            process.stdout.write('\n\n');
        });

    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
