var map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.locationiq.com/v3/streets/vector.json?key=pk.0f147952a41c555a5b70614039fd148b', // stylesheet location
  center: [71.4728225594, 30.2259478878], // starting position [lng, lat]
  zoom: 14 // starting zoom
});

var markers = [];
var points = [];

const api = "http://localhost:8082/api/poi"
// const api = "http://46.101.184.82:8082/api/poi";
const username = 'admin'
const password = 'admin'

map.addControl(new maplibregl.NavigationControl());

// Add Draw Controls
const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    trash: true,
  }
});

map.addControl(draw, 'top-left');

map.on('draw.create', async (event) => {
  draw.trash()
  console.log(event)
  const { features } = event;
  const feature = features[0];
  feature.properties.isSaved = false;
  feature.properties.address = ""
  addNewMarker(feature)
});

map.on('load', async () => loadPoints());

map.on("zoom", () => {
  const minZoom = 14;
  const zoom = map.getZoom();
  if (zoom <= minZoom && markers.length > 0) {
    removePoints();
    showInstructions()
  }
  else if (zoom > minZoom) {
    hideInstructions();
    showPoints();
  }
});

map.on("dragend", () => {
  removePoints();
  loadPoints();
});

// ****************** Utility Functions *************************

function loadPoints() {
  const bounds = map.getBounds();

  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();
  const url = api + "?" + "south=" + south + "&north=" + north + "&west=" + west + "&east=" + east;
  fetch(url, {
    headers: {
      Authorization: "Basic " + btoa(username + ":" + password),
    },
  })
    .then(response => response.json())
    .then(data => {
      points = data
      hideLoader();
      showPoints();
    })
    .catch(error => {
      hideLoader();
      alert(error)
    });
}

function showPoints() {
  points.forEach(point => addNewMarker(pointToFeature(point)));
}

function pointToFeature(point) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.lon, point.lat]
    },
    properties: {
      id: point.id,
      address: point.address,
      isSaved: true,
    }
  }
}

function addNewMarker(feature) {
  const id = feature.properties.id;
  const address = feature.properties.address;
  const lon = feature.geometry.coordinates[0];
  const lat = feature.geometry.coordinates[1];

  // console.log(id + " : " + lng + " : " + lat + " : " + address)

  // Textarea for Address
  const textArea = document.createElement('textarea');
  textArea.className = "form-control address"
  textArea.rows = 5;
  textArea.cols = 30;
  textArea.value = address;
  textArea.disabled = true;
  const textAreaContainer = document.createElement('div');
  textAreaContainer.appendChild(textArea);

  // Edit Button
  const editSaveButton = document.createElement('button');
  editSaveButton.className = "btn btn-primary button";
  editSaveButton.innerText = 'Edit';

  // Delete Button
  const deleteButton = document.createElement('button');
  deleteButton.className = "btn btn-danger button";
  deleteButton.innerText = 'Delete'

  // Button Container
  const btnContainer = document.createElement('div');
  btnContainer.className = "btn-container"
  btnContainer.appendChild(editSaveButton);
  btnContainer.appendChild(deleteButton);

  // Popup Container
  const popupContainer = document.createElement('div');
  popupContainer.className = "modal-content";
  popupContainer.appendChild(textAreaContainer);
  popupContainer.appendChild(btnContainer);

  // Popup
  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: true
  }).setDOMContent(popupContainer)

  // Marker
  const marker = new maplibregl.Marker()
  marker.setLngLat(feature.geometry.coordinates).setPopup(popup).addTo(map);
  markers.push(marker);

  // Event Listeners

  // Marker Dragged
  marker.on('dragend', function () {

  });

  textArea.addEventListener('input', (e) => {
    if (textArea.value != address) {
      editSaveButton.className = "btn btn-info button"
      editSaveButton.innerText = 'Save';
    }
    else {
      editSaveButton.className = "btn btn-primary button";
      editSaveButton.innerText = 'Edit';
    }
  })

  // Edit/Save
  editSaveButton.addEventListener('click', (e) => {
    // Make Pin Editable
    if (editSaveButton.innerText == 'Edit') {
      textArea.disabled = false;
      marker.setDraggable(true);
      console.log(marker)
      return;
    }

    // Update Pin
    fetch(api + id, {
      method: 'PUT',
      body: JSON.stringify({
        address: textArea.value,
        lon,
        lat,
      }),
      headers: {
        Authorization: "Basic " + btoa(username + ":" + password),
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error(error));

    // const lngLat = marker.getLngLat();
    // console.log('Address: ' + textArea.value);
    // console.log('Coordinates: ' + lngLat.lng + ":" + lngLat.lat);
  });

  // Delete
  deleteButton.addEventListener('click', (e) => {
    const text = "Do you realy want to delete this pin?";
    if (confirm(text) == true) {
      showLoader();
      // Delete pin from server
      fetch(api + id, {
        method: 'DELETE',
        headers: {
          Authorization: "Basic " + btoa(username + ":" + password),
        },
      })
        .then(response => {
          if (response.ok) {
            marker.remove()
            hideLoader();
          } else {
            alert('Server delete operation failed.')
          }
        })
        .catch(error => {
          alert(error)
        });
    }
  });

}

function removePoints() {
  markers.forEach(marker => marker.remove());
  markers = []
}

function showLoader() {
  document.getElementById('loader').style.display = "block";
}

function hideLoader() {
  document.getElementById('loader').style.display = "none";
}

function showInstructions() {
  document.getElementById('instructions').style.display = "block";
}

function hideInstructions() {
  document.getElementById('instructions').style.display = "none";
}
