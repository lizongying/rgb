const Canvas = require('canvas');
const Image = Canvas.Image;

const jsdom = require('jsdom');
const document = new jsdom.JSDOM().window.document;

const getContext = function (width, height) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    return canvas.getContext('2d');
};
const getImageData = function (src, scale) {
    if (scale === void 0) scale = 1;

    const img = new Image();
    if (!src.startsWith('data')) {
        img.crossOrigin = 'Anonymous';
    }
    return new Promise(function (resolve, reject) {
        img.onload = function () {
            const width = img.width * scale;
            const height = img.height * scale;
            const context = getContext(width, height);
            context.drawImage(img, 0, 0, width, height);
            const ref = context.getImageData(0, 0, width, height);
            const data = ref.data;
            resolve(data);
        };

        const errorHandler = function () {
            return reject(new Error('An error occurred attempting to load image'));
        };

        img.onerror = errorHandler;
        img.onabort = errorHandler;
        img.src = src;
    });
};
const getCounts = function (data, ignore) {
    const countMap = {};

    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) {
            continue;
        }
        const rgbComponents = Array.from(data.subarray(i, i + 3));
        if (rgbComponents.indexOf(undefined) !== -1) {
            continue;
        }
        const color = alpha && alpha !== 255 ? ("rgba(" + (rgbComponents.concat([alpha]).join(',')) + ")") : ("rgb(" + (rgbComponents.join(',')) + ")");
        if (ignore.indexOf(color) !== -1) {
            continue;
        }

        if (countMap[color]) {
            countMap[color].count++;
        } else {
            countMap[color] = {
                color: color,
                count: 1
            };
        }
    }

    const counts = Object.values(countMap);
    return counts.sort(function (a, b) {
        return b.count - a.count;
    });
};

const defaultOpts = {
    ignore: [],
    scale: 1
};
const index = (function (src, opts) {
    if (opts === void 0) opts = defaultOpts;

    try {
        opts = Object.assign({}, defaultOpts,
            opts);
        const ignore = opts.ignore;
        const scale = opts.scale;

        if (scale > 1 || scale <= 0) {
            console.warn(("You set scale to " + scale + ", which isn't between 0-1. This is either pointless (> 1) or a no-op (≤ 0)"));
        }

        return Promise.resolve(getImageData(src, scale)).then(function (data) {
            return getCounts(data, ignore);

        });
    } catch (e) {
        return Promise.reject(e);
    }
});


index('/Users/lizongying/IdeaProjects/rgb/11.png').then((result) => {
    const color = result[0].color;
    console.log('rgb:', color);
    const rgb = color.split(',');
    const r = parseInt(rgb[0].split('(')[1]);
    const g = parseInt(rgb[1]);
    const b = parseInt(rgb[2].split(')')[0]);
    const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    console.log('hex:', hex);
});