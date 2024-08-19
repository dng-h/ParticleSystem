export class Vector
{
    constructor(x,y,z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    fromPolar(a,b,c)
    {
        var x = a *Math.cos(b) *Math.sin(c);
        var y = a *Math.sin(b) *Math.sin(c);
        var z = a *Math.cos(c);
        return new Vector(x,y,z);
    };

    toList()
    {
        return [this.x, this.y, this.z];
    };

    pow(vec)
    {
        return Vector(this.y * vec.z - this.z * vec.y, this.z * vec.x - this.x * vec.z, this.x * vec.y - this.y * vec.x);
    };

    getMagnitude()
    {
        return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2) + Math.pow(this.z,2));
    };

    setMagnitude(new_mag)
    {
        var prev = new Vector(0,0,0);
        prev = this.toPolar();
        return this.fromPolar(new_mag, prev.y, prev.z);
    };

    normalize()
    {
        return this.setMagnitude(1);
    };

    toPolar()
    {
        var r = this.getMagnitude();
        var phi = Math.atan2(this.y, this.x);
        var theta = Math.atan2(Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2)), this.z);
        return new Vector(r, phi, theta);
    };


    rotation_matrix_3d(axis, theta)
    {
        var rot_mat = [
            [Math.cos(theta) + Math.pow(axis.x,2) * (1 - Math.cos(theta)),
             axis.x * axis.y * (1 - Math.cos(theta)) - axis.z * Math.sin(theta),
             axis.x * axis.z * (1 - Math.cos(theta)) + axis.y * Math.sin(theta)
            ],
            [axis.y * axis.x * (1 - Math.cos(theta)) + axis.z * Math.sin(theta),
             Math.cos(theta) + Math.pow(axis.y,2) * (1 - Math.cos(theta)),
             axis.y * axis.z * (1 - Math.cos(theta)) - axis.x * Math.sin(theta)
            ],
            [axis.z * axis.x * (1 - Math.cos(theta)) - axis.y * Math.sin(theta),
             axis.z * axis.y * (1 - Math.cos(theta)) + axis.x * Math.sin(theta),
             Math.cos(theta) + Math.pow(axis.z,2) * (1 - Math.cos(theta))
            ]
        ];
        return rot_mat;
    };

    multiplyVec(mat, vec)
    {
        var result = [0,0,0];
        for(var i = 0; i < 3; i++)
        {
            for(var j = 0; j < 3; j++)
            {
                result[i] += mat[i][j] * vec[j];
            }
        }
        return result;
    };

    rotateAboutAxis(axis, theta)
    {
        var rot_mat = this.rotation_matrix_3d(axis, theta);
        var neww = this.multiplyVec(rot_mat, this.toList());
        return new Vector(neww[0], neww[1], neww[2]);
    };
}


export class Curve
{
  constructor()
  {
    
  }
  norm(x,n)
  {
    return 20 * (Math.exp(Math.cos(2 * x)) - 0.135) / n;
  };


  


  generate_curve(Pi, Pf, n, phi_i, wl, B, seedx, seedy) {
    var Ua = new Vector(0,0,0);
    Ua.x = Pf.x-Pi.x;
    Ua.y = Pf.y-Pi.y;
    Ua.z = Pf.z-Pi.z;

    var phi = phi_i;
    var theta = Math.atan2(Ua.y, Ua.x);
    var sf_x = wl / (2 * Math.PI);
    var sf_y = wl / 5;

    var N_wav = Ua.getMagnitude() / wl;
    var N = Math.round(n * N_wav);


    var t = 0;

    var ds = 4 / n;
    var dt = 2 * Math.PI * N_wav / N;
    var dx = 2 * Math.PI * N_wav / N;

    var X = [0];
    var Y = [2 * Math.sin(-dt + phi)];

    var len = X.length-1;

    while(X[len] < 2 * Math.PI * N_wav)
    {
        X.push(X[len] + noise.perlin2(seedx, seedy) * this.norm(t + phi, n) + dx);
        Y.push(Math.sin(t + phi))
        seedx += ds;
        t += dt;
        len += 1;
    }
    console.log(X.length);


    X = mult(X, sf_x);
    Y = mult(Y, sf_y);


    var X1 = subb(mult(X, Math.cos(theta)), mult(Y, Math.sin(theta)));
    var Y1 = addd(mult(X, Math.sin(theta)), mult(Y, Math.cos(theta)));

    X = X1;
    Y = Y1;


    for(var j = 0; j < X.length; j++)
    {
      X[j] += Pi.x;
      Y[j] += Pi.y;
      
    }

    return {x: X, y: Y};
  }
}

function mult(lst, num)
{
    var rs = [];
  for(var i = 0; i < lst.length; i++)
  {
    rs.push(lst[i]*num);
  }
  return rs;
}

function addd(lst1,lst2)
{
  var rs = [];
  for(var i = 0; i < lst1.length; i++)
  {
    rs[i] = lst1[i] + lst2[i];
  }
  return rs;
}

function subb(lst1,lst2)
{
  var rs = [];
  for(var i = 0; i < lst1.length; i++)
  {
    rs[i] = lst1[i] - lst2[i];
  }
  return rs;
}

function mulVec(vec1,vec2)
{
  var result = new Vector(0,0,0);
  result.x = vec1.y*vec2.z-vec1.z*vec2.y;
  result.y = vec1.z*vec2.x-vec1.x*vec2.z;
  result.z = vec1.x*vec2.y-vec1.y*vec2.x;
  return result;
}