const webcam = document.getElementById("webcam");
const snapButton = document.getElementById("snapButton");
const snapshotCanvas = document.getElementById("snapshotCanvas");
const discardButton = document.getElementById("discardButton");
const saveButton = document.getElementById("saveButton");
const shareButton = document.getElementById("shareButton");

let snapButtonClicked = false;

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    webcam.srcObject = stream;
    webcam.style.border = "7px solid yellow";
  } catch (error) {
    console.error("Error accessing webcam:", error);
  }
}

function takeSnapshot() {
  snapshotCanvas.width = webcam.videoWidth ;
  snapshotCanvas.height = webcam.videoHeight - 50;
  snapshotCanvas.style.border = "7px solid yellow";
  snapshotCanvas.style.display ="block";

  snapshotCanvas.style.display = "flex";
  snapshotCanvas
    .getContext("2d")
    .drawImage(webcam, 0, 0, webcam.videoWidth, webcam.videoHeight);

  // Hide the video
  webcam.style.display = "none";
  snapButton.style.display = "none";

  // Show the discard and save buttons
  discardButton.style.display = "inline-block";
  saveButton.style.display = "inline-block";
  shareButton.style.display = "inline-block";

  // Stop the video stream
  const tracks = webcam.srcObject.getTracks();
  tracks.forEach((track) => track.stop());
}

function discardSnapshot() {
  // Toggle visibility of buttons
  snapButton.style.display = "inline-block";
  discardButton.style.display = "none";
  saveButton.style.display = "none";

  // Show the video
  webcam.style.display = "block";

  // Hide the snapshot canvas
  snapshotCanvas.style.display = "none";

  // Start the video stream
  startWebcam();
}

async function saveSnapshot() {
  const image = snapshotCanvas.toDataURL("image/png");

  try {
    const response = await fetch("/saveSnapshot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image,
      }),
    });

    if (response.ok) {
      window.alert("Snapshot Shared successfully!");
      console.log("Snapshot Shared successfully.");
    } else {
      console.error("Failed to save snapshot:", response.statusText);
    }
  } catch (error) {
    console.error("Error saving image:", error);
  }
}

snapButton.addEventListener("click", takeSnapshot);
discardButton.addEventListener("click", discardSnapshot);
saveButton.addEventListener("click", saveSnapshot);

startWebcam();

document.getElementById("addUser").addEventListener("click", function () {
  window.location.href = "/searchresults";
});

document.getElementById("viewProfile").addEventListener("click", function () {
  window.location.href = "/viewprofile";
});

document.getElementById("chatbutton").addEventListener("click", function () {
  window.location.href = "/chat";
});

document.getElementById("shareButton").addEventListener("click", function () {
  window.location.href = "/chat";
});

document.getElementById("addUser").addEventListener("click", function () {
  window.location.href = "/searchresults";
});
