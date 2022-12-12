var api = "http://localhost:8082/api/poi"
// var api = "http://46.101.184.82:8082/api/poi";
var username = 'admin'
var password = 'admin'

var minZoom = 14;

var points = [];
var markers = [];

var drawControl = null;

var map = initMap();

map.on('load', () => {
    url = getUrlToFetchPoints();
    fetch(url, {
        headers: {
            Authorization: "Basic " + btoa(username + ":" + password),
        },
    })
        .then(response => response.json())
        .then(data => {
            setLoaderVisible(false);
            points = data;
            showPoints(points);
        })
        .catch(error => {
            setLoaderVisible(false);
            alert(error)
        });
});

map.on('draw.create', async (event) => {
    drawControl.trash()
    const feature = event.features[0];
    const isSaved = false;
    feature.properties.address = ""
    const marker = createMarker(feature, isSaved);
    marker.addTo(map);
});

map.on("dragend", () => {
    const currentZoom = map.getZoom();
    if (currentZoom >= minZoom) {
        url = getUrlToFetchPoints();
        setLoaderVisible(true);
        fetch(url, {
            headers: {
                Authorization: "Basic " + btoa(username + ":" + password),
            },
        })
            .then(response => response.json())
            .then(data => {
                setLoaderVisible(false);
                const fetchedPoints = data;
                const newPoints = fetchedPoints.filter(p => !points.includes(p));
                showPoints(newPoints);
                removeInvisibleMarkersAndPoints();
                points.push(...newPoints);
            })
            .catch(error => {
                setLoaderVisible(false);
                alert(error)
            });
    }
});

map.on("zoomend", () => {
    const currentZoom = map.getZoom();
    if (currentZoom <= minZoom && markers.length > 0) {
        removeMarkers(markers);
        markers.splice(0, markers.length);
        setInstructionsVisible(true);
    }
    else if (currentZoom > minZoom && markers.length == 0) {
        setInstructionsVisible(false);
        showPoints(points);
    }
});

function initMap() {
    const mapStyle = 'https://tiles.locationiq.com/v3/streets/vector.json?key=pk.0f147952a41c555a5b70614039fd148b'
    const startingPosition = [71.4728225594, 30.2259478878];
    const startingZoom = 14;

    const map = new maplibregl.Map({
        container: 'map',
        style: mapStyle,
        center: startingPosition,
        zoom: startingZoom,
    });

    map.addControl(new maplibregl.NavigationControl());

    // Add Draw Controls
    drawControl = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            point: true,
            trash: true,
        }
    });

    map.addControl(drawControl, 'top-left');
    return map;
}

function showPoints(list) {
    list.forEach((point) => {
        feature = pointToFeature(point);
        const marker = createMarker(feature);
        marker.addTo(map);
        markers.push(marker);
    });
    console.log("Points: " + points.length + " : Markers = " + markers.length);
}

function getUrlToFetchPoints() {
    const bounds = map.getBounds();

    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    return api + "?" + "south=" + south + "&north=" + north + "&west=" + west + "&east=" + east;
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
        }
    }
}

function createMarker(feature, isSaved = true) {
    const id = feature.properties.id;
    const address = feature.properties.address;
    const lon = feature.geometry.coordinates[0];
    const lat = feature.geometry.coordinates[1];

    // Textarea for Address
    const textArea = document.createElement('textarea');
    textArea.className = "form-control address"
    textArea.rows = 5;
    textArea.cols = 30;

    if (isSaved) {
        textArea.disabled = true;
        textArea.value = address;
    }
    else {
        textArea.placeholder = "Please enter address of this place here.";
    }

    const textAreaContainer = document.createElement('div');
    textAreaContainer.appendChild(textArea);

    // Edit Button
    const editSaveButton = document.createElement('button');
    editSaveButton.className = "btn btn-primary button";
    editSaveButton.innerText = (isSaved ? 'Edit' : 'Save');

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

    if (isSaved) {
        // ID
        const span = document.createElement('span');
        span.className = "badge badge-light";
        span.innerHTML = id;
        // ID Container
        const idContainer = document.createElement('div');
        idContainer.className = 'id';
        idContainer.appendChild(span);
        popupContainer.appendChild(idContainer);
    }

    popupContainer.appendChild(textAreaContainer);
    popupContainer.appendChild(btnContainer);

    // Popup
    const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: true
    }).setDOMContent(popupContainer)

    // Marker
    const marker = new maplibregl.Marker()
    marker.setLngLat(feature.geometry.coordinates).setPopup(popup);

    if (!isSaved) {
        marker.setDraggable(true);
    }

    // Event Listeners

    // Marker Dragged
    // marker.on('dragend', function () {
    // });

    textArea.addEventListener('input', (e) => {
        if (!isSaved || textArea.value != address) {
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
            return;
        }

        // Update Pin
        setLoaderVisible(true);
        fetch(api + "/" + id, {
            method: 'PUT',
            body: JSON.stringify({
                address: textArea.value,
                // lon,
                // lat,
            }),
            headers: {
                Authorization: "Basic " + btoa(username + ":" + password),
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json()).then(data => console.log(data))
            .catch(error => console.error(error));

        setLoaderVisible(false);
    });

    // Delete
    deleteButton.addEventListener('click', (e) => {
        if (isSaved) {
            const text = "Do you realy want to delete this pin?";
            if (confirm(text) == true) {
                setLoaderVisible(true);
                // Delete pin from server
                fetch(api + "/" + id, {
                    method: 'DELETE',
                    headers: {
                        Authorization: "Basic " + btoa(username + ":" + password),
                    },
                })
                    .then(response => {
                        if (response.ok) {
                            setLoaderVisible(false);
                            marker.remove()
                        } else {
                            alert('Server delete operation failed.')
                        }
                    })
                    .catch(error => {
                        alert(error)
                    });
            }
        }
        else {
            marker.remove()
        }
    });

    return marker;
}

function removeMarkers(list) {
    list.forEach(marker => marker.remove());
}

function removeInvisibleMarkersAndPoints() {
    const bounds = map.getBounds();
    markers.forEach(marker => {
        const lnglat = marker.getLngLat();
        if (!bounds.contains(lnglat)) {
            marker.remove();
            const point = points.find(p => p.lat == lnglat.lat && p.lon == lnglat.lng);
            points.splice(points.indexOf(point), 1);
        }
    });
}

function setLoaderVisible(isBusy) {
    document.getElementById('loader').style.display = (isBusy ? 'block' : 'none');
}

function setInstructionsVisible(isVisible) {
    document.getElementById('instructions').style.display = (isVisible ? 'block' : 'none');
}
