window.onload = function() {

////SVG UPLOAD

$('#svgpaste').on('input propertychange paste', function() {
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




///PAPER TOOLS





/////Pen Tool

var penTool = new Tool();

var path;
        var types = ['point', 'handleIn', 'handleOut'];
        function findHandle(point) {
            for (var i = 0, l = path.segments.length; i < l; i++) {
                for (var j = 0; j < 3; j++) {
                    var type = types[j];
                    var segment = path.segments[i];
                    var segmentPoint = type == 'point'
                            ? segment.point
                            : segment.point + segment[type];
                    var distance = (point - segmentPoint).length;
                    if (distance < 3) {
                        return {
                            type: type,
                            segment: segment
                        };
                    }
                }
            }
            return null;
        }

        var currentSegment, mode, type;
        penTool.onMouseDown = function(event) {
            if (currentSegment)
                currentSegment.selected = false;
            mode = type = currentSegment = null;

            if (!path) {
                path = new Path();
                path.fillColor = {
                    hue: 360 * Math.random(),
                    saturation: 1,
                    brightness: 1,
                    alpha: 0.5
                };
            }

            var result = findHandle(event.point);
            if (result) {
                currentSegment = result.segment;
                type = result.type;
                if (path.segments.length > 1 && result.type == 'point'
                        && result.segment.index == 0) {
                    mode = 'close';
                    path.closed = true;
                    path.selected = false;
                    path = null;
                }
            }

            if (mode != 'close') {
                mode = currentSegment ? 'move' : 'add';
                if (!currentSegment)
                    currentSegment = path.add(event.point);
                currentSegment.selected = true;
            }
        }

        penTool.onMouseDrag = function(event) {
            if (mode == 'move' && type == 'point') {
                currentSegment.point = event.point;
            } else if (mode != 'close') {
                var delta = event.delta.clone();
                if (type == 'handleOut' || mode == 'add')
                    delta = -delta;
                currentSegment.handleIn += delta;
                currentSegment.handleOut -= delta;
            }
        }

/////Selection Tool

var selTool = new Tool();

var selectionRectangle = null;
var selectionRectangleScale=null;
var selectionRectangleScaleNormalized=null;
var selectionRectangleRotation=null;

var segment, path, selectionRectangleSegment;
var movePath = false;

function initSelectionRectangle(path) {
    if(selectionRectangle!=null)
        selectionRectangle.remove();
    var reset = path.rotation==0 && path.scaling.x==1 && path.scaling.y==1;
    var bounds;
    if(reset)
    {
        console.log('reset');
        bounds = path.bounds;
        path.pInitialBounds = path.bounds;
    }
    else
    {
        console.log('no reset');
        bounds = path.pInitialBounds;
    }
    console.log('bounds: ' + bounds);
    b = bounds.clone().expand(10,10);
    
    selectionRectangle = new Path.Rectangle(b);
    selectionRectangle.pivot = selectionRectangle.position;
    selectionRectangle.insert(2, new Point(b.center.x, b.top));
    selectionRectangle.insert(2, new Point(b.center.x, b.top-25));
    selectionRectangle.insert(2, new Point(b.center.x, b.top));
    if(!reset)
    {
        selectionRectangle.position = path.bounds.center;
        selectionRectangle.rotation = path.rotation;
        selectionRectangle.scaling = path.scaling;
    }

    selectionRectangle.strokeWidth = 1;
    selectionRectangle.strokeColor = 'blue';
    selectionRectangle.name = "selection rectangle";
    selectionRectangle.selected = true;
    selectionRectangle.ppath = path;
    selectionRectangle.ppath.pivot = selectionRectangle.pivot;
}
selTool.onMouseDown= function(event) {
	segment = path = null;
	var hitResult = project.hitTest(event.point, hitOptions);
	if (!hitResult)
		return;


	if (hitResult) {
        console.log(hitResult);
		path = hitResult.item;
		
		if (hitResult.type == 'segment') {
			if(selectionRectangle!=null && path.name == "selection rectangle")
			{
                console.log('selectionRectangle');
                if(hitResult.segment.index >= 2 && hitResult.segment.index <= 4)
                {
                    console.log('rotation');
                    selectionRectangleRotation = 0;
                }
                else
                {
                    console.log('scale');
                    selectionRectangleScale = event.point.subtract(selectionRectangle.bounds.center).length/path.scaling.x;
                }
			}
            else
                segment = hitResult.segment;
		} else if (hitResult.type == 'stroke' && path!=selectionRectangle) {
			var location = hitResult.location;
			//segment = path.insert(location.index + 1, event.point);
			//path.smooth();
		}
		if((selectionRectangle==null || selectionRectangle.ppath!=path) && selectionRectangle!=path)
		{
            initSelectionRectangle(path);
		}
	}
	else
	{
        if(selectionRectangle!=null)
            selectionRectangle.remove();
	}
	movePath = hitResult.type == 'fill';
	if (movePath)
		project.activeLayer.addChild(hitResult.item);
}

selTool.onMouseMove= function(event) {
	project.activeLayer.selected = false;
	if (event.item)
	{
		event.item.selected = true;
	}
    if(selectionRectangle)
        selectionRectangle.selected = true;
}

selTool.onMouseDrag = function(event) {
	if (selectionRectangleScale!=null)
	{
        ratio = event.point.subtract(selectionRectangle.bounds.center).length/selectionRectangleScale;
        scaling = new Point(ratio, ratio);
        selectionRectangle.scaling = scaling;
        selectionRectangle.ppath.scaling = scaling;
        console.log('scaling: '+selectionRectangle.ppath);
        return;
	}
	else if(selectionRectangleRotation!=null)
	{
        console.log('rotation: '+selectionRectangle.ppath);
        rotation = event.point.subtract(selectionRectangle.pivot).angle + 90;
        selectionRectangle.ppath.rotation = rotation;
        selectionRectangle.rotation = rotation;
        return;
	}
	if (segment) {
		//segment.point += event.delta;
		//path.smooth();
		//initSelectionRectangle(path);
	} else if (path) {
	    if (path!=selectionRectangle)
	    {
		    path.position.x += event.delta.x;
		    path.position.y += event.delta.y;

		    selectionRectangle.position.x += event.delta.x;
		    selectionRectangle.position.y += event.delta.y;

	    }
	    else
	    {
		    selectionRectangle.position.x += event.delta.x;
		    selectionRectangle.position.y += event.delta.y;

		    selectionRectangle.ppath.position.x += event.delta.x;
		    selectionRectangle.ppath.position.y += event.delta.y;

	    }
	}
}

selTool.onMouseUp = function(event) {
    selectionRectangleScale = null;
    selectionRectangleRotation = null;
}

///Tool buttons

$('#penTool').click(function(){
    removeSelRect();
penTool.activate();
});

$('#selTool').click(function(){
selTool.activate();
});

function removeSelRect(){
     if(selectionRectangle!=null){
            selectionRectangle.remove();
	}
}

///THIS IS THREE JS STUFF////


var materials = [];
var textures = [];
var threewidth = $("#threejs").width();



var camera, scene, renderer, geometry, material, mesh;

init();
animate();
console.log("working1");


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
    //textureagain.minFilter = THREE.NearestMipMapNearestFilter;
    textureagain.needsUpdate = true;
    textures.push(textureagain);
    
var material = new THREE.MeshPhongMaterial( { map:textureagain,transparency:false, side:THREE.DoubleSide, opacity:1.0} );
//materials.push(material);







var loader = new THREE.OBJLoader();

loader.load( 'obj/last.obj', function ( object ) {

    

    object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) {

            child.material = material;
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
    renderer.setSize(threewidth, threewidth);

    $('#threejs').append(renderer.domElement);

}

////WEBCAM TEXTURE
$('#webtex').click(function(){
    alert("coming soon");
   //var webtex = null;
   //webtex = new THREEx.WebcamTexture();
   //materials[0].map = webtex.texture;
    });

var controls	= new THREE.OrbitControls(camera,renderer.domElement)

function animate() {

    requestAnimationFrame(animate);
    render();

}

function render() {
    for (var i = 0; i < textures.length; i++) {
        textures[i].needsUpdate = true;
    }
	//webtex.update();

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