import React from "react";
import ReactDOM from "react-dom";
import * as cvstfjs from "@microsoft/customvision-tfjs";
import "./styles.css";
const threshold = 0.1;

async function loadModelCustomVision() {
  let model = new cvstfjs.ObjectDetectionModel();
  await model.loadModelAsync(
"https://raw.githubusercontent.com/atefshimaa/model/main/model.json"
   );
console.log(model);
  return model;
}

const classesDir = {
  1: {
    name: "not-recycled",
    id: 1
  },
  2: {
    name: "recycled",
    id: 2
  }
};

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "environment"
          }
        })
        .then((stream) => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });

      const modelPromise = loadModelCustomVision();

      Promise.all([modelPromise, webCamPromise])
        .then((values) => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  detectFrame = (video, model) => {
    //tf.engine().startScope();
    model.executeAsync(video).then((predictions) => {
      this.renderPredictions(predictions, video);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
      //tf.engine().endScope();
    });
  };

  buildDetectedObjects(scores, threshold, boxes, classes, classesDir) {
    const detectionObjects = [];
    var video_frame = document.getElementById("frame");

    scores.forEach((score, i) => {
      if (score > threshold) {
        const bbox = [];
        const minX = boxes[i][0] * video_frame.offsetWidth;
        const minY = boxes[i][1] * video_frame.offsetHeight;
        const maxX = boxes[i][2] * video_frame.offsetWidth;
        const maxY = boxes[i][3] * video_frame.offsetHeight;
        bbox[0] = minX;
        bbox[1] = minY;
        bbox[2] = maxX - minX;
        bbox[3] = maxY - minY;
        detectionObjects.push({
          class: classes[i],
          label: classesDir[classes[i] + 1].name,
          score: score.toFixed(4),
          bbox: bbox
        });
      }

    });
    console.log(detectionObjects);
    console.log(scores);
    return detectionObjects;
  }

  renderPredictions = (predictions) => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    //Getting predictions
    console.log(predictions);
    const boxes = predictions[0]; //predictions[2].arraySync();
    const scores = predictions[1]; //predictions[0].arraySync();
    const classes = predictions[2]; //predictions[6].dataSync();
    const detections = this.buildDetectedObjects(
      scores,
      threshold,
      boxes,
      classes,
      classesDir
    );

    detections.forEach((item) => {
      const x = item["bbox"][0];
      const y = item["bbox"][1];
      const width = item["bbox"][2];
      const height = item["bbox"][3];

      // Draw the bounding box.
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y +70, width, height);
      ctx.fillText(item["label"], x, y);
      console.log(item);
    });
  };

  render() {
    return (
      <div>
        <h1 className="h1">Real Time Object Detection</h1>
        <video
          style={{ height: "1200px", width: "900px" }}
          className="size"
          autoPlay
          playsInline
          muted
          ref={this.videoRef}
          width="900"
          height="1200"
          id="frame"
        ></video>
        <canvas
          className="size"
          ref={this.canvasRef}
          width="900"
          height="1200"
        />
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
