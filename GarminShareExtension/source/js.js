let workoutId, importWorkoutName;
let devicesInfo = [];
let targetDevices = [];
let trainingData;
let submitButton;
("use strict");

(function addMenuItem() {
  let li = document.createElement("li");
  li.className = "main-nav-menu-item";
  let a = document.createElement("a");
  a.href = "#";
  a.className = "main-nav-link";
  a.innerText = "Import";
  a.onclick = showDialog;
  li.appendChild(a);
  let waitExist = setInterval(function () {
    if (document.getElementsByClassName("icon-workouts")[0]) {
      clearInterval(waitExist);
      document
        .getElementsByClassName("icon-workouts")[0]
        .parentElement.parentElement.getElementsByTagName("ul")[0]
        .appendChild(li);
      document
        .querySelector("a[href*='/modern/workouts']")
        .addEventListener("click", addExportIcon);
      if (document.URL.includes("workouts")) {
        addExportIcon();
      }
    }
  }, 500);
})();

(function getDevices() {
  let requestConfig = {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,cs;q=0.8",
      nk: "NT",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-app-ver": "4.39.1.0",
    },
    referrer: "https://connect.garmin.com/modern/workouts",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  };
  fetch(
    "https://connect.garmin.com/modern/proxy/device-service/deviceregistration/devices",
    requestConfig
  ).then((response) => {
    response.json().then((devices) => {
      devices.forEach((device) => {
        if (device.deviceCategories.includes("FITNESS")) {
          devicesInfo.push({
            id: device.unitId,
            imgSource: device.imageUrl,
            name: device.productDisplayName,
          });
        }
      });
    });
  });
})();

function addExportIcon() {
  let waitExist = setInterval(function () {
    if (document.querySelector(".workout-actions")) {
      clearInterval(waitExist);
      for (const parent of document.querySelectorAll(".workout-actions")) {
        const trainingId = parent.querySelector(".send-to-device").dataset.id;
        const span = document.createElement("span");
        span.className = "workout-share";
        span.dataset.id = trainingId;
        span.addEventListener("click", () =>
          exportTrainings([trainingId], "clipboard")
        );
        const shareIcon = document.createElement("i");
        shareIcon.className = "icon-share";
        span.appendChild(shareIcon);
        parent.insertBefore(span, parent.querySelector(".add-to-calendar"));

        const download = document.createElement("li");
        const downLink = document.createElement("a");
        downLink.innerText = chrome.i18n.getMessage("download Training");
        download.appendChild(downLink);
        download.className = "menuitem";
        download.addEventListener("click", () =>
          exportTrainings([trainingId], "download")
        );
        parent.querySelector(".dropdown-menu").appendChild(download);
      }
      const downloadAll = document.createElement("a");
      downloadAll.innerHTML = "&#x21e9;";
      downloadAll.addEventListener("click", () =>
        exportTrainings([], "download")
      );
      document
        .querySelector(".sortable-header-row th")
        .appendChild(downloadAll);
    }
  }, 25);
}

async function getTrainingData(id) {
  let requestConfig = {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-US,en;q=0.9,cs;q=0.8",
      nk: "NT",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-app-ver": "4.39.1.0",
      "x-lang": "cs-CZ",
      "x-requested-with": "XMLHttpRequest",
    },
    referrer: "https://connect.garmin.com/modern/workout/" + id,
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  };
  const response = await fetch(
    "https://connect.garmin.com/modern/proxy/workout-service/workout/" + id,
    requestConfig
  );
  return await response.json();
}

async function exportTrainings(ids = [], method) {
  if (!ids.length) {
    document
      .querySelectorAll(".workout-share")
      .forEach((item) => ids.push(item.dataset.id));
  }
  const promises = ids.map((id) => getTrainingData(id));

  const trainingsData = await Promise.all(promises);
  const stringifiedTrainingsData = JSON.stringify(
    ids.length === 1 ? trainingsData[0] : trainingsData
  );

  const colectionName = trainingsData
    .map((training) => training.workoutName)
    .join(", ");

  if (method === "clipboard") {
    navigator.clipboard.writeText(stringifiedTrainingsData);
  } else if (method === "download") {
    downloadLink = document.createElement("a");
    downloadLink.setAttribute("download", colectionName + ".json");
    downloadLink.setAttribute(
      "href",
      "data:text/json;charset=utf-8," + stringifiedTrainingsData
    );
    downloadLink.click();
  }
  notification(colectionName + chrome.i18n.getMessage(method));
}

function showDialog() {
  submitButton = document.createElement("button");
  let dialogContainer = document.createElement("div");
  dialogContainer.id = "myDialog";
  dialogContainer.className = "dialog-container";
  let dialog = document.createElement("div");
  dialog.className = "dialog";
  let button = document.createElement("button");
  button.className = "dialog-close-button";
  button.type = "button";
  button.innerText = "×";
  button.onclick = closeDialog;
  let header = document.createElement("div");
  header.className = "dialog-header";
  let h3 = document.createElement("h3");
  h3.innerText = "Import";
  let dialogBody = document.createElement("div");
  dialogBody.className = "dialog-body";
  let compatibleHead = document.createElement("div");
  let compatibleHeadText = document.createElement("p");
  compatibleHeadText.innerText =
    devicesInfo.length === 1
      ? chrome.i18n.getMessage("compatibleDevice")
      : chrome.i18n.getMessage("compatibleDevices");
  let compatibleDeviceDivs = [];
  for (let i = 0; i < devicesInfo.length; i++) {
    let compatibleDevice = document.createElement("div");
    compatibleDevice.className = "compatible-devices";
    compatibleDevice.name = "targetDevice";
    compatibleDevice.id = "targetDevice_" + i;
    let img = document.createElement("img");
    img.className = "device-image";
    img.src = devicesInfo[i].imgSource;
    img.style = "margin-right: 10px; width: 70px;";
    let h3 = document.createElement("h3");
    h3.className = "device-name";
    h3.innerText = devicesInfo[i].name;
    let checkbox = document.createElement("input");
    checkbox.className = "device-checkbox";
    checkbox.type = "checkbox";
    checkbox.name = "deviceCheckbox";
    checkbox.id = devicesInfo[i].id;
    checkbox.value = devicesInfo[i].name;
    if (devicesInfo.length === 1) {
      checkbox.style.display = "none";
      checkbox.checked = true;
    }
    compatibleDevice.appendChild(checkbox);
    compatibleDevice.appendChild(img);
    compatibleDevice.appendChild(h3);
    compatibleDeviceDivs.push(compatibleDevice);
  }
  let bodyText = document.createElement("div");
  bodyText.className = "body-text";
  bodyText.innerText = chrome.i18n.getMessage("inputHint");
  let bodyInput = document.createElement("input");
  bodyInput.className = "body-input";
  bodyInput.placeholder = chrome.i18n.getMessage("inputPlaceholder");
  bodyInput.id = "bodyInput";
  let clipboardData = navigator.clipboard
    .readText()
    .then((response) => JSON.parse(response))
    .then((result) => {
      if (result.workoutName) {
        bodyInput.style.display = "none";
        bodyText.innerText =
          chrome.i18n.getMessage("bodyText") + result.workoutName + "?";
        trainingData = result;
        importWorkoutName = result.workoutName;
      }
    });
  let dialogFooter = document.createElement("div");
  dialogFooter.className = "dialog-footer";
  let checkboxSpan = document.createElement("span");
  checkboxSpan.className = "checkbox-span";
  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "onlyImport";
  checkbox.onchange = deviceCheckboxToggle;
  let checkboxSpanSpan = document.createElement("span");
  checkboxSpanSpan.className = "checkbox-span-span";
  checkboxSpanSpan.innerText = chrome.i18n.getMessage("onlyImport");
  let cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-secondary cancel button";
  cancelButton.innerText = "Cancel";
  cancelButton.onclick = closeDialog;
  submitButton.className = "btn btn-confirm button";
  submitButton.innerText = chrome.i18n.getMessage("importAndSend");
  submitButton.onclick = checkImportProperties;
  let dialogBackground = document.createElement("div");
  dialogBackground.className = "dialog-background";

  header.appendChild(h3);
  compatibleHead.appendChild(compatibleHeadText);
  dialogBody.appendChild(compatibleHead);
  for (let i = 0; i < compatibleDeviceDivs.length; i++) {
    dialogBody.appendChild(compatibleDeviceDivs[i]);
  }
  dialogBody.appendChild(bodyText);
  dialogBody.appendChild(bodyInput);
  checkboxSpan.appendChild(checkbox);
  checkboxSpan.appendChild(checkboxSpanSpan);
  dialogFooter.appendChild(checkboxSpan);
  dialogFooter.appendChild(cancelButton);
  dialogFooter.appendChild(submitButton);
  dialog.appendChild(button);
  dialog.appendChild(header);
  dialog.appendChild(dialogBody);
  dialog.appendChild(dialogFooter);
  dialogContainer.appendChild(dialog);
  dialogContainer.appendChild(dialogBackground);
  document.getElementsByClassName("main-body")[0].appendChild(dialogContainer);
}

function deviceCheckboxToggle() {
  let toggle = document.getElementById("onlyImport").checked;
  let count = document.getElementsByName("deviceCheckbox").length;
  if (toggle) {
    submitButton.innerText = chrome.i18n.getMessage("import");
  } else {
    submitButton.innerText = chrome.i18n.getMessage("importAndSend");
  }
  for (let i = 0; i < count; i++) {
    if (toggle && count !== 1) {
      document.getElementsByName("deviceCheckbox")[i].checked = false;
    }
    document.getElementsByName("deviceCheckbox")[i].disabled = toggle;
  }
}

function importTraining() {
  if (!trainingData) {
    trainingData = JSON.parse(document.getElementById("bodyInput").value);
  }
  let requestConfig = {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-US,en;q=0.9,cs;q=0.8",
      "content-type": "application/json",
      nk: "NT",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-app-ver": "4.39.1.0",
      "x-lang": "cs-CZ",
      "x-requested-with": "XMLHttpRequest",
    },
    referrer:
      "https://connect.garmin.com/modern/workout/create/strength_training",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify(trainingData),
    method: "POST",
    mode: "cors",
    credentials: "include",
  };
  fetch(
    "https://connect.garmin.com/modern/proxy/workout-service/workout",
    requestConfig
  )
    .then((response) => response.json())
    .then((result) => {
      workoutId = result.workoutId;
      importWorkoutName = result.workoutName;
    })
    .then(() =>
      document.getElementById("onlyImport").checked
        ? showNotification(true)
        : sendTraining()
    );
}

function checkImportProperties() {
  targetDevices = [];
  if (
    !trainingData &&
    !document.getElementById("bodyInput").value.includes("workoutName")
  ) {
    alert("data");
  } else {
    if (document.getElementById("onlyImport").checked === false) {
      for (
        let i = 0;
        i < document.getElementsByName("deviceCheckbox").length;
        i++
      ) {
        if (document.getElementsByName("deviceCheckbox")[i].checked) {
          targetDevices.push({
            id: document.getElementsByName("deviceCheckbox")[i].id,
            name: document.getElementsByName("deviceCheckbox")[i].value,
          });
        }
      }
      targetDevices.length === 0 ? alert("device") : importTraining();
    } else importTraining();
  }
}

function sendTraining() {
  for (let i = 0; i < targetDevices.length; i++) {
    let requestConfig = {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,cs;q=0.8",
        "content-type": "application/json;charset=UTF-8",
        nk: "NT",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-app-ver": "4.39.1.0",
      },
      referrer: "https://connect.garmin.com/modern/workouts",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `[{"deviceId":${targetDevices[i].id},"messageUrl":"workout-service/workout/FIT/${workoutId}","messageType":"workouts","messageName":"${importWorkoutName}","groupName":null,"priority":1,"fileType":"FIT","metaDataId":${workoutId}}]`,
      method: "POST",
      mode: "cors",
      credentials: "include",
    };
    fetch(
      "https://connect.garmin.com/modern/proxy/device-service/devicemessage/messages",
      requestConfig
    );
  }
  showNotification(false);
}

function showNotification(onlyImport) {
  let devices = "";
  for (let i = 0; i < targetDevices.length; i++) {
    let name = targetDevices[i].name;
    devices +=
      (i === 0 ? " " : i === targetDevices.length - 1 ? " & " : ", ") + name;
  }
  notification(
    trainingData.workoutName +
      chrome.i18n.getMessage("imported") +
      (onlyImport ? "" : chrome.i18n.getMessage("andSent") + devices) +
      "."
  );
  closeDialog();
}

function closeDialog() {
  document.getElementById("myDialog").remove();
  trainingData = "";
}

function notification(text) {
  let reactSheet = document.createElement("div");
  reactSheet.className = "react-sheet-content";
  reactSheet.id = "successDialog";
  let style = document.createElement("div");
  style.className = "notification-style";
  let notificationBox = document.createElement("div");
  notificationBox.className = "notification-box";
  let notificationMsgText = document.createElement("div");
  notificationMsgText.className = "notification-text";
  let notification = document.createElement("div");
  notification.className = "notification";
  notification.innerText = text;

  notificationMsgText.appendChild(notification);
  notificationBox.appendChild(notificationMsgText);
  style.appendChild(notificationBox);
  reactSheet.appendChild(style);
  document.getElementsByClassName("main-body")[0].appendChild(reactSheet);
  setTimeout(() => {
    document.getElementById("successDialog").remove();
  }, 4000);
}

function alert(reason) {
  let modal = document.createElement("div");
  modal.id = "alertModal";
  modal.className = "modal in";
  modal.style = "display: block;";
  let modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";
  let modalHeaderContent = document.createElement("h3");
  modalHeaderContent.className = "modal-header h3";
  modalHeader.appendChild(modalHeaderContent);
  let modalBody = document.createElement("div");
  modalBody.className = "modal-body";
  let modalBodyParagraph = document.createElement("p");
  let text;
  if (reason === "device") {
    modalHeaderContent.innerText = chrome.i18n.getMessage("noDevice");
    text = chrome.i18n.getMessage("noDeviceText");
  } else {
    modalHeaderContent.innerText = chrome.i18n.getMessage("noData");
    text = chrome.i18n.getMessage("noDataText");
  }
  modalBodyParagraph.innerText = text;
  modalBody.appendChild(modalBodyParagraph);

  modal.appendChild(modalHeader);
  modal.appendChild(modalBody);

  document.body.appendChild(modal);
  setTimeout(() => {
    closeAlert();
  }, 3000);
}

function closeAlert() {
  document.getElementById("alertModal").remove();
}
