var map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.locationiq.com/v3/streets/vector.json?key=pk.0f147952a41c555a5b70614039fd148b', // stylesheet location
  center: [71.4728225594, 30.2259478878], // starting position [lng, lat]
  zoom: 10 // starting zoom
});

const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [71.46767271809128, 30.33031214415695]
      },
      properties: {
        isSaved: true,
        address: 'Address of Point 1'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [71.7828430061773, 30.165710123851937]
      },
      properties: {
        isSaved: true,
        address: 'Address of Point 2'
      }
    }
  ]
};

map.addControl(new maplibregl.NavigationControl());

const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    trash: true,
  }
});

map.addControl(draw, 'top-left');

const listener = async (event) => {
  const { features } = event;
  // const pointFeature = {
  //   type: 'Feature',
  //   geometry: {
  //     type: 'Point',
  //     coordinates: [71.7828430061773, 30.165710123851937]
  //   },
  //   properties: {
  //     isSaved: true,
  //     address: 'Address of Point 2'
  //   }
  // }
  const feature = features[0];
  feature.properties.isSaved = false;
  feature.properties.address = "Unknow Address"
  console.log(feature)
  addNewMarker(feature)
  // let firstFeature = features[0];
  // if (firstFeature) {
  //   let { coordinates } = firstFeature.geometry;
  //   if (Array.isArray(coordinates[0][0])) {
  //     [coordinates] = coordinates;
  //   }
  //   console.log('Point: ' + coordinates[0] + " : " + coordinates[1])
  //   var el = document.createElement('div');
  //   el.innerHTML = 'Marker 1';
  //   const marker = new maplibregl.Marker({
  //     draggable: true
  //   })
  //     .setLngLat([coordinates[0], coordinates[1]])

  //     // .setPopup(new maplibregl.Popup().setHTML("<div><input name='poi-address' /><div><button>Save</button><button>Delete</button></div></div>"))
  //     .addTo(map);
  //   marker.on('drag', function () {
  //     console.log('Draging marker')
  //     // var lngLat = marker.getLngLat();
  //     // marker.setLngLat(lngLat);
  //   });

  //   markers.push(marker);
};
// const newItem = { name: '', area: geometryToArea(feature.geometry) };
// draw.delete(feature.id);
// try {
//   const response = await fetch('/api/geofences', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(newItem),
//   });
//   if (response.ok) {
//     const item = await response.json();
//     navigate(`/settings/geofence/${item.id}`);
//   } else {
//     throw Error(await response.text());
//   }
// } catch (error) {
//   dispatch(errorsActions.push(error.message));
// }
// };

map.on('draw.create', listener);

var bounds = map.getBounds();
console.log(bounds); // Outputs the LngLatBounds objects


// add markers to map
for (const feature of geojson.features) {
  if (feature.geometry.type == 'Point') {
    addNewMarker(feature);
  }
}

function addNewMarker(feature) {
  const el = document.createElement('i');
  el.className = feature.properties.isSaved ? 'icon-pin-alt marker' : 'icon-pin marker';

  const marker = new maplibregl.Marker({
    element: el,
    draggable: true
  })

  marker.setLngLat(feature.geometry.coordinates)

  const address = feature.properties.address;

  const textArea = document.createElement('textarea');
  textArea.className = "form-control address"
  textArea.rows = 5;
  textArea.cols = 30;
  textArea.value = address;
  const textAreaContainer = document.createElement('div');
  textAreaContainer.appendChild(textArea);

  const saveButton = document.createElement('button');
  saveButton.className = "btn btn-primary button";
  saveButton.innerText = 'Save';
  saveButton.addEventListener('click', (e) => {
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

  btnContainer.appendChild(deleteButton);
  btnContainer.appendChild(saveButton);

  const popupContainer = document.createElement('div');
  popupContainer.className = "modal-content";
  popupContainer.appendChild(textAreaContainer);
  popupContainer.appendChild(btnContainer)

  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: true
  }).setDOMContent(popupContainer)

  marker.setPopup(popup)
  marker.on('drag', function () {
    marker.getElement().className = 'icon-pin marker';
  })

  marker.addTo(map);
}