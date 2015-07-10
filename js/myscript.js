window.onload = function() {

////SVG UPLOAD
$('#svgupload').click(function(){
    var content = document.getElementById('hidethis');
    var pasteText = document.getElementById('svgpaste');
    //console.log(content.innerHTML);
    //content.innerHTML = $("#svgpaste").val().replace(/(\n|\r|\r\n)/g, '<br>');
    importSVG(pasteText.value);
    pasteText.value = "";
});
		
var size = $("#paperdiv").width();


///THIS IS PAPER JS STUFF////
paper.install(window);
// Get a reference to the canvas object
var canvas = document.getElementById('myCanvas');
// Create an empty project and a view for the canvas:
canvas.width = size;
canvas.height = size;
paper.setup(canvas);

function onResize(event) {
    // Whenever the view is resized, move the path to its center:
    canvas.width = size;
    canvas.height = size;
}

var values = {
    paths: 2,
    minPoints: 5,
    maxPoints: 15,
    minRadius: 30,
    maxRadius: 90
};

var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 2
};

//createPaths();
function importSVG(theContent){
var mySVG = project.importSVG(theContent);
mySVG.fitBounds(view.bounds);
for(var i = 0; i<mySVG.children.length;i++){
    mySVG.children[i].onDoubleClick = function(event){
        $('input[type=file]').click()
    };
}
return mySVG;
};
var theSVG = document.getElementById('shell');
var shell = importSVG(theSVG);
shell.locked=true;



function createPaths() {
    var radiusDelta = values.maxRadius - values.minRadius;
    var pointsDelta = values.maxPoints - values.minPoints;
    for (var i = 0; i < values.paths; i++) {
        var radius = values.minRadius + Math.random() * radiusDelta;
        var points = values.minPoints + Math.floor(Math.random() * pointsDelta);
        var center = {};
        center.x = view.size.width * Point.random().x;
        center.y = view.size.height * Point.random().y;
        var path = createBlob(center, radius, points);
        var lightness = (Math.random() - 0.5) * 0.4 + 0.4;
        var hue = Math.random() * 360;
        path.fillColor = {
            hue: 200,
            saturation: 1,
            lightness: 0.5
        };
        path.strokeColor = 'black';
    }
}



function createBlob(center, maxRadius, points) {

    var path = new Path.Circle(center, Math.random() * maxRadius);

    return path;
}

var segment, path;
var movePath = false;





var tool = new Tool();



tool.onMouseDown = function (event) {
    segment = path = null;
    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult) return;

    if (event.modifiers.shift) {
        if (hitResult.type == 'segment') {
            hitResult.segment.remove();
        }
        return;
    }

    if (hitResult) {
        path = hitResult.item;
        if (hitResult.type == 'segment') {
            segment = hitResult.segment;
        } else if (hitResult.type == 'stroke') {
            var location = hitResult.location;
            segment = path.insert(location.index + 1, event.point);
            path.smooth();
        }
    }
    movePath = hitResult.type == 'fill';
    if (movePath) project.activeLayer.addChild(hitResult.item);
};

tool.onMouseMove = function onMouseMove(event) {
    project.activeLayer.selected = false;
    if (event.item) event.item.selected = true;
};

tool.onMouseDrag = function onMouseDrag(event) {
    if (segment) {
        segment.point.x += event.delta.x;
        segment.point.y += event.delta.y;

        path.smooth();
    } else if (path) {
        path.position.x += event.delta.x;
        path.position.y += event.delta.y;



    }
};

///THIS IS THREE JS STUFF////


var materials = [];
var textures = [];


var camera, scene, renderer, geometry, material, mesh;

init();
animate();
console.log("working1");

var webtex = null;
var material = new THREE.MeshPhongMaterial( { transparency:false, side:THREE.DoubleSide, opacity:1.0} );
console.log("madethemat");




  webtex = new THREEx.WebcamTexture();
          console.log("madethetexture");


function init() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
    camera.position.z = 500;
    scene.add(camera);
    var light = new THREE.AmbientLight( 0xffeedd ); // soft white light
    scene.add( light );
var directionalLight = new THREE.DirectionalLight( 0xffeedd );
				directionalLight.position.set( 0, 0, 1 );
				scene.add( directionalLight );
var directionalLight = new THREE.DirectionalLight( 0xffeedd );
directionalLight.position.set( 0, 0, -1 );
scene.add( directionalLight );

var directionalLight = new THREE.DirectionalLight( 0xffeedd );
				directionalLight.position.set( 0, 1, 0);
				scene.add( directionalLight );



    
    // model
    var onProgress = function ( xhr ) {
					if ( xhr.lengthComputable ) {
						var percentComplete = xhr.loaded / xhr.total * 100;
						console.log( Math.round(percentComplete, 2) + '% downloaded' );
					}
				};

				var onError = function ( xhr ) {
				};
    var manager = new THREE.LoadingManager();
    manager.onProgress = function ( item, loaded, total ) {

            console.log( item, loaded, total );
    };
    
    var textureagain = new THREE.Texture();
    textureagain.image = canvas;
    textureagain.needsUpdate = true;

var loader = new THREE.OBJLoader();

loader.load( 'obj/last.obj', function ( object ) {

    

    object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) {

            child.material = material;
	    material.map = textureagain;
	    if (webtex) {
		material.map = webtex.texture;
	    }
            console.log('assigned the material');

        }

    } );

    scene.add(object);
    console.log('happening');

    console.log('added mesh');
    var bBox = new THREE.Box3().setFromObject(object);
    console.log('bbox is: ' + bBox);
    var bheight = bBox.size().y;
        console.log('height is: ' + bheight);

    var dist = bheight / (2 * Math.tan(50 * Math.PI / 360));
            console.log('dist is: ' + dist);

    var pos = object.position;
    console.log('pos is:' + pos);
    camera.position.set(pos.x, pos.y, dist * 4); // fudge factor so you can see the boundaries
    camera.lookAt(pos);

} );


    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(size, size+4);

    $('#threejs').append(renderer.domElement);

}

var controls	= new THREE.OrbitControls(camera,renderer.domElement)

function animate() {

    requestAnimationFrame(animate);
    render();

}

function render() {
    for (var i = 0; i < textures.length; i++) {
        textures[i].needsUpdate = true;
    }
    if (webtex) {
	webtex.update();
    }

    renderer.render(scene, camera);

}

////FILE READER STUFF

if ( window.FileReader ) {
 
    document.getElementById("collection").onchange = function doIt(){
     
        var counter = -1, file;
        
        while ( file = this.files[ ++counter ] ) {
         
            var reader = new FileReader();
 
            reader.onloadend = (function(file){
                
                return function(){

                    var image = new Image();
    
                    image.height = 100;
                    image.title = file.name;
                    image.id = "donthide";
                    image.src = /^image/.test(file.type) 
                        ? this.result 
                        : "http://i.stack.imgur.com/t9QlH.png";
    
                    document.body.appendChild( image );
                    
                }
                    
            })(file);
                
            reader.readAsDataURL( file );
            
        }
        
    }
    
}
};