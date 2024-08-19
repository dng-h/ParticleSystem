import {Vector} from "./vector.js";

const _VSAttr = `
uniform float pointMultiplier;

attribute float size;
attribute float angle;
attribute vec4 colour;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColour = colour;
}`;

const _FSAttr = `

uniform sampler2D diffuseTexture;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;

var count = 0;


//define a ParticleSystem class
export class ParticleSystem {

  constructor(params, posX, posZ) {
    const uniforms = {
        diffuseTexture: {
            value: new THREE.TextureLoader().load('./textures/light.png')
        },
        pointMultiplier: {
            value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
        }
    };

    this._material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VSAttr,
        fragmentShader: _FSAttr,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        vertexColors: true
    });

    this.X = posX;
    this.Z = posZ;
    this.particleNumber = posX.length;
    posX = [];
    posZ = [];

    this._camera = params.camera;
    this._scene= params.parent;

    this._particlesList = [];
    this.pos = [];

    this._auroraGeom = new THREE.BufferGeometry();

    // this._auroraGeom.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    // this._auroraGeom.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
    // this._auroraGeom.setAttribute('colour', new THREE.Float32BufferAttribute([], 4));
    this._auroraPoints = new THREE.Points(this._auroraGeom, this._material);
    this._auroraPoints.name="auroraParticles" + posX[20];
    this._scene.add(this._auroraPoints);
    this.pPositions = [];
    this.pSizes = [];
    this.pColours = [];

    this._auroraPoints.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));

    this._auroraGeom.dispose();
    this._material.dispose();
  
    this._UpdateGeometry();
  }


  _CreateParticles(h, l) {
      var hh = Math.random()*100+50;
      for (var ii = 0; ii < this.particleNumber; ii++) {
        var t = Math.random()*150;
        this.pos.push(hh+ii/h-l);
        for(var j = 0; j<150; j++){
          var y = Math.random()*t + ii/h - l;

          //var alpha = 1.0;

          this.pPositions.push(this.X[ii], y, this.Z[ii]);
          this.pSizes.push(Math.random()*8 + 2);
          this.pColours.push(0,1,0,1);
          
          // this._particlesList.push({
          //     position: new THREE.Vector3(
          //         this.X[ii],
          //         y,
          //         this.Z[ii]
          //     ),
          //     size: Math.random()*8 + 2,
          //     colour: new THREE.Color(0,1,0),
          //     alpha: alpha
          // });
        }
      }
      console.log("Num of particles: " + this.pSizes.length);

    this._auroraPoints.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.pPositions, 3));
    this._auroraPoints.geometry.setAttribute('size', new THREE.Float32BufferAttribute(this.pSizes, 1));
    this._auroraPoints.geometry.setAttribute('colour', new THREE.Float32BufferAttribute(this.pColours, 4));
    this.X = [];
    this.Z = [];
  }

  _UpdateGeometry() {
    // var pPositions = [];
    // var pSizes = [];
    // var pColours = [];

    // for (let p of this._particlesList) {
    //   pPositions.push(p.position.x, p.position.y, p.position.z);
    //   pSizes.push(p.size);
    //   pColours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
    // }
    this._auroraPoints.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.pPositions, 3));
    this._auroraPoints.geometry.setAttribute('size', new THREE.Float32BufferAttribute(this.pSizes, 1));
    this._auroraPoints.geometry.setAttribute('colour', new THREE.Float32BufferAttribute(this.pColours, 4));
    
    this._auroraPoints.geometry.attributes.position.needsUpdate = true;
    this._auroraPoints.geometry.attributes.size.needsUpdate = true;
    this._auroraPoints.geometry.attributes.colour.needsUpdate = true;

    // pPositions = [];
    // pSizes = [];
    // pColours = [];
  }

  _UpdateParticles(c1,c2) {
    var tt = 0;
    var k = 0;
    for(var j = 0; j < this.particleNumber; j++)
    {
      this.pos[j] += ( Math.sin( (j + count)*0.1 ) * 1 );
      for(var m = 0; m < 150; m++)
      {
        // if(this._particlesList[tt].position.y >= this.pos[j]-5 && this._particlesList[tt].position.y <= this.pos[j]+5)
        //   mixColor(this._particlesList[tt].colour, c1, c2, 0.5);
        // else if(this._particlesList[tt].position.y < this.pos[j]-5)
        //   mixColor(this._particlesList[tt].colour, c1, c2, 1.0);
        // else
        //   mixColor(this._particlesList[tt].colour, c1, c2, 0.0);
        // var ds = ( Math.sin( (j/10 + count )*0.2 ) * 1 );
        // this._particlesList[tt].position.z += ds;
        // this._particlesList[tt].position.x += ds;
        // this._particlesList[tt].position.y += ds;
        var color = new THREE.Color();

        if(this.pPositions[tt+1] >= this.pos[j]-5 && this.pPositions[tt+1] <= this.pos[j]+5)
          mixColor(color, c1, c2, 0.5);
        else if(this.pPositions[tt+1] < this.pos[j]-5)
          mixColor(color, c1, c2, 1.0);
        else
          mixColor(color, c1, c2, 0.0);
        this.pColours[k] = color.r;
        this.pColours[k+1] = color.g;
        this.pColours[k+2] = color.b;
        var ds = ( Math.sin( (j/10 + count )*0.2 ) * 1 );
        this.pPositions[tt] += ds;
        this.pPositions[tt+1] += ds;
        this.pPositions[tt+2] += ds;
        tt += 3;
        k += 4;
      }
    }
    count += 0.5;

  }

  LightOn(c1, c2) {
    this._UpdateGeometry();
    this._UpdateParticles(c1, c2);
  }

}

function mixColor(color, color1, color2, ratio)
{
  var mixColor = new THREE.Color();
  mixColor.copy(color1).lerp(color2, ratio);
  color.r = mixColor.r;
  color.g = mixColor.g;
  color.b = mixColor.b;
  // r = mixColor.r;
  // g = mixColor.g;
  // b = mixColor.b;
}