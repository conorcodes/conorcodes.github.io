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
    tolerance: 10,
};

var theClipper;
function importSVG(theContent){
var mySVG = project.importSVG(theContent);
//mySVG.fitBounds(view.bounds);
for(var i = 0; i<mySVG.children.length;i++){
    mySVG.children[i].onDoubleClick = function(event){
        var result = $('input[type=file]').click();
	theClipper = this;
	
    };
}
return mySVG;
};
var theSVG = document.getElementById('shell');
var shell = importSVG(theSVG);
shell.fitBounds(view.bounds);
shell.blendMode = 'multiply';
paper.view.draw();




///PAPER TOOLS


/////Pen Tool

var pencilTool = new Tool();

    //pencil   
    pencilTool.onMouseDown = function(event) {
        if (path) {
            path.selected = false;
        }
        
        path = new Path({
            segments: [event.point],
            strokeColor: 'black',
            strokeWidth: 3
        });
    }

    pencilTool.onMouseDrag = function(event) {
        path.add(event.point);
    }

    pencilTool.onMouseUp = function(event) {
        path.simplify(5);    
    }


/////Selection Tool
var selTool = new Tool();

selTool.onKeyDown = function(event) {
    if (event.key == 'delete') {
	project.selectedItems[0].removeChildren();
        project.selectedItems[0].remove();
	selectionRectangle.remove();
    }
     if (event.key == 'escape') {
	project.deselectAll();
     }
      if (event.key == '+') {
	project.selectedItems[1].scale(1.1);
     }
          if (event.key == '-') {
	project.selectedItems[1].scale(.9);
     }
}


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

$('#pencilTool').click(function(){
    removeSelRect();
pencilTool.activate();
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
var uppermaterial=null;



var camera, scene, renderer, geometry, material, mesh;

init();
animate();


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
    


var loader = new THREE.OBJMTLLoader();


var importedOBJ = loader.load( 'obj/BBall_Shoe.obj', 'obj/BBall_Shoe.mtl', function ( object ) {

    

    object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) {

            //child.material = material;
            console.log('found 1');

        }

    } );

    scene.add(object);
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
////WEBCAM TEXTURE
var webtex = null;
	var updateFcts = [];

   webtex = new THREEx.WebcamTexture();
   //uppermaterial.map = webtex.texture;
	updateFcts.push(function(delta, now){
    // to update the texture are every frame
    webtex.update(delta, now)
})
   


    var textureagain = new THREE.Texture();
    textureagain.image = canvas;
    textureagain.minFilter = THREE.NearestMipMapNearestFilter;
    textureagain.needsUpdate = true;
    textures.push(textureagain);
    
    uppermaterial = new THREE.MeshBasicMaterial( { map:webtex,transparency:false, side:THREE.DoubleSide, opacity:1.0} );
materials.push(material);
	//uppermaterial.needsUpdate = true;

var importedUpper = loader.load( 'obj/Upper.obj', 'obj/Upper.mtl', function ( object ) {

    

    object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) {

            child.material = uppermaterial;
            console.log('found 1');

        }

    } );

    scene.add(object);
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


    
$('#loadimg').click(function(){
    var result = $('input[type=file]').click();
    });

var controls	= new THREE.OrbitControls(camera,renderer.domElement)

//////////////////////////////////////////////////////////////////////////////////
	//		render the scene						//
	//////////////////////////////////////////////////////////////////////////////////
	updateFcts.push(function(){
		renderer.render( scene, camera );		
	})
	
	//////////////////////////////////////////////////////////////////////////////////
	//		loop runner							//
	//////////////////////////////////////////////////////////////////////////////////
	var lastTimeMsec= null
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		// call each update function
		updateFcts.forEach(function(updateFn){
			updateFn(deltaMsec/1000, nowMsec/1000)
		})
	})

////FILE READER STUFF
function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

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
                    image.id = makeid();
                    image.src = /^image/.test(file.type) 
                        ? this.result 
                        : "http://i.stack.imgur.com/t9QlH.png";
    
                    $('.hideimages').append(image);
		    var raster = new Raster(image.id);
		    raster.fitBounds(theClipper.bounds, true);
		    //raster.sendToBack();
		    shell.locked=false;
		    shell.bringToFront();
		    shell.locked=true;
		    //var group = new Group(theClipper, raster);
		    //group.clipped = true;
                    
                }
                    
            })(file);
                
            reader.readAsDataURL( file );
            
        }
        
    }
    
}
};
console.log("done")
