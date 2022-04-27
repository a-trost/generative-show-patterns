const { builder } = require("@netlify/functions");

const { createSVGWindow } = require("svgdom");
const window = createSVGWindow();
const document = window.document;
const { SVG, registerWindow } = require("@svgdotjs/svg.js");
const {
  createVoronoiTessellation,
  random,
} = require("@georgedoescode/generative-utils");

// register window and document
registerWindow(window, document);

let draw, mask, itemGroup;

const shortcurl =
  "M93.6312 100C97.2601 100 100.224 97.0544 99.9866 93.4334C98.3997 69.2558 88.0911 46.3843 70.8534 29.1466C53.6157 11.9089 30.7442 1.60027 6.56667 0.013364C2.94562 -0.224306 1.25325e-05 2.73991 1.25325e-05 6.36876L0 34.9732C0 38.6021 2.95132 41.5056 6.55727 41.9126C19.6478 43.39 31.9289 49.2594 41.3347 58.6653C50.7406 68.0711 56.6101 80.3522 58.0874 93.4427C58.4944 97.0487 61.3979 100 65.0268 100H93.6312Z";

const longcurl =
  "M95.3852 72.6076C98.0147 72.6076 100.163 70.4736 99.9903 67.8498C99.3069 57.4433 96.3881 47.2862 91.411 38.0793C85.6777 27.4736 77.3937 18.4625 67.3067 11.8592C57.2197 5.25588 45.6471 1.26828 33.6335 0.256271C23.2043 -0.622265 12.7277 0.765661 2.9168 4.30223C0.443101 5.19393 -0.653498 8.01614 0.398376 10.4261L5.22254 21.4788C6.27441 23.8887 9.07577 24.9667 11.5732 24.144C18.0784 22.001 24.9647 21.1844 31.8219 21.762C40.2646 22.4732 48.3973 25.2756 55.486 29.9161C62.5748 34.5566 68.3964 40.8893 72.4255 48.3425C75.698 54.3961 77.7043 61.0341 78.3425 67.8533C78.5875 70.4714 80.6961 72.6076 83.3256 72.6076H95.3852Z";

const square =
  "M0 15.0794C0 6.75126 6.75126 0 15.0794 0H84.9206C93.2487 0 100 6.75126 100 15.0794V84.9206C100 93.2487 93.2487 100 84.9206 100H15.0794C6.75126 100 0 93.2487 0 84.9206V15.0794Z";

const halfCircle =
  "M0 3.34333C0 1.49686 1.49577 0 3.34089 0H96.6591C98.5042 0 100 1.49686 100 3.34334V3.96331C100 31.5978 77.6142 54 50 54C22.3858 54 0 31.5978 0 3.9633V3.34333Z";

const hexagon =
  "M70.3711 4.85661e-08C73.6786 5.25089e-08 76.7348 1.76453 78.3886 4.6289L98.7597 39.9127C100.413 42.7771 100.413 46.3061 98.7597 49.1705L78.3886 84.4543C76.7348 87.3186 73.6786 89.0832 70.3711 89.0832H29.6289C26.3214 89.0832 23.2652 87.3186 21.6114 84.4543L1.24031 49.1705C-0.413437 46.3061 -0.413436 42.7771 1.24031 39.9127L21.6114 4.6289C23.2652 1.76452 26.3214 -3.94284e-09 29.6289 0L70.3711 4.85661e-08Z";

const circle =
  "M100 50C100 77.6142 77.6142 100 50 100C22.3858 100 0 77.6142 0 50C0 22.3858 22.3858 0 50 0C77.6142 0 100 22.3858 100 50Z";

const items = [circle, shortcurl, longcurl, square, halfCircle, hexagon];

let COLORS = ["#F8574E", "#F8574E", "#164993", "#F9CB25", "#FBABBA", "#2BC1AE"];

let background = "#FEFBF5";
const canvasWidth = 318;
const canvasHeight = 168;

function drawItem(size, xPos, yPos) {
  const scaleFactor = 0.75;

  const chosenItem = random(items);
  const scaleMultiplier = (size / 100) * scaleFactor;
  const rotation = random(0, 360, true);
  const color = random(COLORS);

  itemGroup
    .path(chosenItem)
    .transform({
      origin: "center center",
    })
    .fill(color)
    .center(xPos, yPos)
    .scale(scaleMultiplier)
    .rotate(rotation);
}

const createSVG = async (canvasWidth, canvasHeight) => {
  draw = SVG(document.documentElement)
    .size(canvasWidth, canvasHeight)
    .viewbox(`0 0 ${canvasWidth} ${canvasHeight}`);

  draw.rect(canvasWidth, canvasHeight).attr({ fill: background });

  mask = draw.rect(canvasWidth, canvasHeight).attr({ fill: "#fff" });
  itemGroup = draw.group();
  const numItems = 32;

  const points = [...Array(numItems)].map(() => {
    return {
      x: random(0, canvasWidth),
      y: random(0, canvasHeight),
    };
  });
  const offset = 50;

  const tessellation = createVoronoiTessellation({
    width: canvasWidth + offset,
    height: canvasHeight + offset,
    points,
    relaxIterations: 8,
  });

  tessellation.cells.forEach((cell) => {
    const size = cell.innerCircleRadius * 2;
    const xPos = cell.centroid.x - offset / 2;
    const yPos = cell.centroid.y - offset / 2;
    drawItem(size, xPos, yPos);
  });

  itemGroup.maskWith(mask);
  itemGroup.opacity(0.3);
  return draw.svg();
};

async function handler(event) {
  let pathSplit = event.path.split("/").filter((entry) => !!entry);
  let [_seed, width, height] = pathSplit;

  // Set Defaults
  width = width || 318;
  height = height || 168;

  try {
    let output = await createSVG(width, height);

    return {
      statusCode: 200,
      headers: {
        "content-type": `image/svg+xml`,
      },
      body: `${output}`,
      isBase64Encoded: false,
    };
  } catch (error) {
    console.log("Error", error);

    return {
      // We need to return 200 here or Firefox won’t display the image
      // HOWEVER a 200 means that if it times out on the first attempt it will stay the default image until the next build.
      statusCode: 200,
      headers: {
        "content-type": "image/svg+xml",
        "x-error-message": error.message,
      },
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false"><text x="20" y="35">: )</text></svg>`,
      isBase64Encoded: false,
    };
  }
}

exports.handler = builder(handler);
