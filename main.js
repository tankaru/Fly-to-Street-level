
const client_id = 'NEh3V0ZjaE1fT1Nkdk9jMnJlSGNQQTo1NzRiNDEwZmM3MzZhNmIw';

let mly;
let map;
let flying = false;


init();

function init(){
	initPhoto();
	initMap();

}
function initPhoto(){
	mly = new Mapillary.Viewer(
		'mly',
		client_id,
		// photo id
		null,
		{
			component: {
				cover: false,
				tag: true,
			},
        });

}
function initMap(){
//地図を表示するdiv要素のidを設定
map = L.map('mapcontainer');


  //表示するタイルレイヤのURLとAttributionコントロールの記述を設定して、地図に追加する
  const osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	  attribution: "(C)<a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
	  maxZoom: 23,
	  maxNativeZoom: 19,
	  minZoom: 1,
	  //maxBounds: [[35.47, 139.62], [35.45, 139.64]],
  });

  const hash = new L.Hash(map);
  const url = location.href;
  const match = url.match(/#(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/);
  if (match){
      const [, zoom, lat, lon] = match;
      map.setView([lat, lon], zoom);
  } else {
      map.setView([37.9243912, 139.045191], 5);	//日本全域
  }

  const kokudoLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',{
	attribution: '© <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
	maxZoom: 23,
	maxNativeZoom: 18,
    minZoom: 1,
    minNativeZoom: 2,
	}).addTo(map);
	
	const baseMap = {
        "国土地理院シームレス":kokudoLayer,
        "OpenStreetMap":osmLayer,

	};
 
	const mapillaryLayer = L.tileLayer('https://raster-tiles.mapillary.com/v0.1/{z}/{x}/{y}.png',{
		attribution: '(C)<a href="https://www.mapillary.com/">Mapillary</a>, CC BY',
	  maxZoom: 21,
	  maxNativeZoom: 17,
	});
	mapillaryLayer.setOpacity(0.65);
	const overlayLayer = {
		"Mapillary":mapillaryLayer,
	}
	//レイヤ設定
	const layerControl = L.control.layers(baseMap,overlayLayer,{"collapsed":true,});
    layerControl.addTo(map);


  map.options.singleClickTimeout = 250;
  map.on('click',function ( e ) {
	//クリック地点に移動
    openPhotoNearby(e.latlng);    
    //map.flyTo(e.latlng, 20);
        } );
    
    map.on('zoomend', function(e){
        if (flying) {
            console.log('flyend');
            flying = false;
            document.getElementById('map').style.zIndex = '1';
            document.getElementById('photo').style.zIndex = '2';
        }
    });

}

function openPhotoNearby(latlng){

    const url = `https://a.mapillary.com/v3/images?per_page=1&client_id=${client_id}&closeto=${latlng.lng},${latlng.lat}&radius=3000` ;
	
	const request = new XMLHttpRequest();
	//request.responseType = 'json';
	request.open('GET', url, true);
	request.onload = function () {
        const data = JSON.parse(this.response);
        const feature = data.features[0];
        const key = feature.properties.key;
        const coordinates = feature.geometry.coordinates;

        flying = true;
        map.flyTo([coordinates[1], coordinates[0]], 20);
        
        mly.moveToKey(key);


	};
	request.send();
}

var loadMapillary = function(){
	var murl = document.getElementById("mapillaryurl").value;
	const [,lat,lon,mid] = murl.match(/lat=(-?\d[0-9.]*).*&lng=(-?\d[0-9.]*).*pKey=([^&]*)&/);

	mly.moveToKey(mid);
}

const R = 6378100;	
function getDistancePhi(base, target){
	const x1 = rad(base.lng);
	const y1 = rad(base.lat);
	const x2 = rad(target.lng);
	const y2 = rad(target.lat);

	const dx = x2 - x1;

	const distance = R * Math.acos(Math.sin(y1)*Math.sin(y2) + Math.cos(y1)*Math.cos(y2)*Math.cos(dx));
	const phi = 90 - deg(Math.atan2( Math.cos(y1)*Math.tan(y2) - Math.sin(y1)*Math.cos(dx), Math.sin(dx)));

	return [distance, phi];
}
function rad(deg){
	return deg/180*Math.PI;
}

function deg(rad){
	return rad/Math.PI*180;
}