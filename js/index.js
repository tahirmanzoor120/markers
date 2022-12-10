var map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.locationiq.com/v3/streets/vector.json?key=pk.0f147952a41c555a5b70614039fd148b', // stylesheet location
  center: [71.4728225594, 30.2259478878], // starting position [lng, lat]
  zoom: 14 // starting zoom
});

var markers = [];
var points = [];

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
  const { features } = event;
  const feature = features[0];
  feature.properties.isSaved = false;
  feature.properties.address = "Unknow Address"
  console.log(feature)
  addNewMarker(feature)
});

map.on('load', async () => {
  
  points = await fetchAllPoints();
  hideLoader();
  showPoints(getVisiblePoints());
});

map.on("zoom", () => {
  const minZoom = 14;
  const zoom = map.getZoom();
  if (zoom <= minZoom && markers.length > 0) {
    removePoints();
    showInstructions()
  }
  else if (zoom > minZoom) {
    hideInstructions();
    showPoints(getVisiblePoints());
  }
});

map.on("dragend", () => {
  removePoints();
  showPoints();
});

// ****************** Utility Functions *************************

async function fetchAllPoints() {
  // const api = "http://localhost:8082/api/poi"
  const api = "http://46.101.184.82:8082/api/poi";
  const username = 'admin'
  const password = 'admin'

  const data = await fetch(api, {
    headers: {
      Authorization: "Basic " + btoa(username + ":" + password),
    },
  });

  return await data.json();
}

function getVisiblePoints() {
  // Get the current map bounds
  const bounds = map.getBounds();
  // Filter the points within the bounds
  return points.filter(point => {
    const coordinates = new maplibregl.LngLat(point.lon, point.lat)
    return bounds.contains(coordinates)
  })
}

function showPoints() {
  getVisiblePoints(points).forEach(point => addNewMarker(pointToFeature(point)));
}

function pointToFeature(point) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.lon, point.lat]
    },
    properties: {
      isSaved: true,
      address: point.address,
    }
  }
}

function addNewMarker(feature) {
  const el = document.createElement('i');
  el.className = feature.properties.isSaved ? 'icon-pin-alt marker' : 'icon-pin marker';

  const marker = new maplibregl.Marker()

  marker.setLngLat(feature.geometry.coordinates)

  const address = feature.properties.address;

  const textArea = document.createElement('textarea');
  textArea.className = "form-control address"
  textArea.rows = 5;
  textArea.cols = 30;
  textArea.value = address;
  textArea.disabled = true;
  const textAreaContainer = document.createElement('div');
  textAreaContainer.appendChild(textArea);

  const editSaveButton = document.createElement('button');
  editSaveButton.className = "btn btn-primary button";
  editSaveButton.innerText = 'Edit';
  editSaveButton.addEventListener('click', (e) => {
    // Make PIN Editable
    if (editSaveButton.innerText == 'Edit') {
      textArea.disabled = false;
      editSaveButton.innerHTML == 'Save';
      return;
    }
    const newText = textArea.value;
    if (newText != address) {
      console.log('Address: ' + newText);
      const lngLat = marker.getLngLat();
      console.log('Coordinates: ' + lngLat.lng + ":" + lngLat.lat);
      console.log('Saving Pin...')
    }
  })

  const deleteButton = document.createElement('button');
  deleteButton.className = "btn btn-danger button";
  deleteButton.innerText = 'Delete'
  deleteButton.addEventListener('click', (e) => {
    const text = "Do you realy want to delete this pin?";
    if (confirm(text) == true) {
      console.log('Delete Pin')
    }
  });

  const btnContainer = document.createElement('div');
  btnContainer.className = "btn-container"


  btnContainer.appendChild(editSaveButton);
  btnContainer.appendChild(deleteButton);

  const popupContainer = document.createElement('div');
  popupContainer.className = "modal-content";
  popupContainer.appendChild(textAreaContainer);
  popupContainer.appendChild(btnContainer)

  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: true
  }).setDOMContent(popupContainer)

  marker.setPopup(popup)
  marker.on('dragend', function () {
    marker.getElement().className = 'icon-pin marker';
  })

  marker.addTo(map);
  markers.push(marker);
}

function removePoints() {
  markers.forEach(marker => marker.remove());
  markers = []
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
