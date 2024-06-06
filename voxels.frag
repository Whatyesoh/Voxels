extern Image noise;
extern Image voxelList;
extern number numVoxels;
extern number chunkWidth;
extern number chunkHeight;
extern vec3 lookFrom = vec3(1.5,1.5,-3);
extern vec3 lookAt = vec3(1.5,1.5,-2);
extern float depth;
extern float size;
float seed;

float rand(vec2 uv) {
    vec4 inputs = Texel(noise,uv);
    seed = fract(sin(dot(vec2(seed,inputs.r), vec2(12.9898, 78.233))) * 43758.5453);
    return seed;
}

struct ray {
    vec3 orig;
    vec3 dir;
};

vec3 unitVector (vec3 v) {
    return v / sqrt(v.x*v.x + v.y*v.y + v.z * v.z);
}

float vecLength (vec3 v) {
    return sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

mat4 translate(vec3 t) {
    return mat4(
        vec4(1,0,0,t.x),
        vec4(0,1,0,t.y),
        vec4(0,0,1,t.z),
        vec4(0,0,0,1)
    );
}

mat4 rotX(float theta) {
    return mat4(
        vec4(1,0         ,0          ,0),
        vec4(0,cos(theta),-sin(theta),0),
        vec4(0,sin(theta),cos(theta) ,0),
        vec4(0,0         ,0          ,1)
    );
}

mat4 rotY(float theta) {
    return mat4(
        vec4(cos(theta) ,0         ,sin(theta),0),
        vec4(0          ,1         ,0         ,0),
        vec4(-sin(theta),0         ,cos(theta),0),
        vec4(0          ,0         ,0         ,1)
    );
}

mat4 rotZ(float theta) {
    return mat4(
        vec4(cos(theta),-sin(theta),0          ,0),
        vec4(sin(theta),cos(theta) ,0          ,0),
        vec4(0         ,0          ,1          ,0),
        vec4(0         ,0          ,0          ,1)
    );
}

bool sphereHit(ray r, vec3 edge, float size, out vec3 hitLoc, out vec3 normal) {
    vec3 oc = edge + size/2 - r.orig;
    float a = dot(r.dir,r.dir);
    float h = dot(r.dir,oc);
    float c = dot(oc,oc) - (size/2) * (size/2);
    float discriminant = h * h - a * c;
    
    if (discriminant < 0) {
        return false;
    }
    
    float sqrtd = sqrt(discriminant);

    float root = (h - sqrtd) / a;

    if (root <= 0 || root >= 100000000) {
        root = (h + sqrtd) / a;
        if (root <= 0 || root >= 10000000) {
            return false;
        }
    }

    hitLoc = r.orig + root * r.dir;

    normal = hitLoc - (edge + size/2);

    return true; 
}

bool boxHit(ray r, vec3 edge, float size, out vec3 hitLoc, out vec3 normal) {

    float tmin = (edge.x - r.orig.x) / r.dir.x; 
    float tmax = (edge.x + size - r.orig.x) / r.dir.x; 

    float temp;

    if (tmin > tmax){
        temp = tmin;
        tmin = tmax;
        tmax = temp;
    }

    float tymin = (edge.y - r.orig.y) / r.dir.y; 
    float tymax = (edge.y + size - r.orig.y) / r.dir.y; 

    if (tymin > tymax)  {
        temp = tymin;
        tymin = tymax;
        tymax = temp;
    } 

    if ((tmin > tymax) || (tymin > tmax)) 
        return false;

    if (tymin > tmin) tmin = tymin; 
    if (tymax < tmax) tmax = tymax; 

    float tzmin = (edge.z - r.orig.z) / r.dir.z; 
    float tzmax = (edge.z + size - r.orig.z) / r.dir.z; 

    if (tzmin > tzmax) {
        temp = tzmin;
        tzmin = tzmax;
        tzmax = temp;
    }

    if ((tmin > tzmax) || (tzmin > tmax)) 
        return false;; 

    if (tzmin > tmin) tmin = tzmin; 
    if (tzmax < tmax) tmax = tzmax; 

    if (tmax < 0 && tmin < 0) {
        return false;
    }

    hitLoc = r.orig + tmin * r.dir;

    if (tmin == (edge.y - r.orig.y) / r.dir.y) {
        normal = vec3(0,-1,0);
    }
    else if (tmin == (edge.x - r.orig.x) / r.dir.x) {
        normal = vec3(-1,0,0);
    }
    else if (tmin == (edge.z - r.orig.z) / r.dir.z) {
        normal = vec3(0,0,-1);
    }
    else if (tmin == (edge.y + size - r.orig.y) / r.dir.y) {
        normal = vec3(0,1,0);
    }
    else if (tmin == (edge.x + size - r.orig.x) / r.dir.x) {
        normal = vec3(1,0,0);
    }
    else if (tmin == (edge.z + size - r.orig.z) / r.dir.z) {
        normal = vec3(0,0,1);
    }
    
    return true;
}

vec4 effect(vec4 color, Image texture, vec2 uv, vec2 xy) {
    float width = xy.x / uv.x;
    float height = xy.y / uv.y;
    float vPHeight = 2 / size;
    float vPWidth = vPHeight * (width/height);
    number samplesPerPixel = 1;
    vec3 cameraCenter = lookFrom;
    float focalLength = 1;
    vec3 vup = unitVector(vec3(0,1,0));
    vec3 w = unitVector(lookFrom-lookAt);
    vec3 u = unitVector(cross(vup,w));
    vec3 v = cross(w,u);
    vec3 vPU = vPWidth * u;
    vec3 vPV = vPHeight * -v;
    vec3 pDU = vPU / width;
    vec3 pDV = vPV / height;
    vec3 vUL = cameraCenter - (focalLength * w) - vPU/2 - vPV/2;
    vec3 pixelOrigin = vUL + .5 * pDV + .5 * pDU;

    ray r;
    r.orig = cameraCenter;
    r.dir = pixelOrigin + xy.x * pDU + xy.y * pDV - r.orig;
    vec3 point = r.orig;
    r.dir = unitVector(r.dir);

    vec3 hitSpot = vec3(2,1,0);

    vec3 light = vec3 (3.5,1 + 0 + .5,.5);


    //return Texel(voxelList,vec2(.5/width,.5/height));

    vec3 hitLoc;
    vec3 normal;

    /*    
    

    if (sphereHit(r,hitSpot,1,hitLoc,normal)) {

        //return vec4(normal,1);

        normal = -unitVector(normal);
        vec3 v = unitVector(hitLoc - cameraCenter);
        vec3 l = unitVector(hitLoc - light);
        vec3 surface = vec3(1,1,0);
        vec3 cool = vec3(0,0,.55) + .25 * surface;
        vec3 warm = vec3(.3,.3,0) + .25 * surface;
        vec3 highlight = vec3(1,1,1);
        float t = (dot(normal,l) + 1) / 2;
        vec3 r0 = 2*(dot(-normal,l)) * -normal - l;
        float s = min(max((100 * (dot(r0,v))-97),0),1);

        vec3 color = s * highlight + (1-s) * ((1-t) * cool + t * warm);

        //return vec4(-l,1);

        //return vec4(r0,1);

        //return  vec4(1,1,1,1);

        return vec4(color,1);
    }

    //*/

    if (boxHit(r,hitSpot,1,hitLoc,normal)) {
        point = hitLoc;
        for (int i = 0; i < 50000; i ++) {
            if (point.x >= hitSpot.x && point.y >= hitSpot.y && point.z >= hitSpot.z && point.x <= hitSpot.x + 1 && point.y <= hitSpot.y + 1 && point.z <= hitSpot.z + 1) {
                vec3 oldPoint = point;
                vec2 pixelSelect = vec2(0,0);
                vec3 lowerBound = vec3(0,0,0);
                point -= hitSpot;
                point = point / 1;
                vec4 data = vec4(0,0,0,0);
                for (int j = 1; j <= depth; j++) {

                    pixelSelect.x = data.r * 4 * 255;
                    pixelSelect.y = data.g * 2 * 255;

                    float halfway = (1/pow(2,j));
                    
                    if (point.z > lowerBound.z + halfway) {
                        pixelSelect.y += 1;
                        lowerBound.z += halfway;
                    }
                    if (point.x > lowerBound.x + halfway) {
                        pixelSelect.x += 1;
                        lowerBound.x += halfway;
                    }
                    if (point.y > lowerBound.y + halfway) {
                        pixelSelect.x += 2;
                        lowerBound.y += halfway;
                    }
                
                    pixelSelect += .5;

                    pixelSelect.y /= height;
                    pixelSelect.x /= width;

                    data = Texel(voxelList,pixelSelect);

                    if (data.a < 1 && data.a > 0) {

                        boxHit(r,hitSpot + lowerBound,1/pow(2,j),hitLoc,normal);
                        
                        //return vec4(normal,1);

                        normal = -unitVector(normal);
                        vec3 v = unitVector(hitLoc - cameraCenter);
                        vec3 l = unitVector(hitLoc - light);
                        vec3 surface = vec3(1,1,1);
                        vec3 cool = vec3(0,0,.55) + .25 * surface;
                        vec3 warm = vec3(.3,.3,0) + .25 * surface;
                        vec3 highlight = vec3(1,1,1);
                        float t = (dot(normal,l) + 1) / 2;
                        vec3 r0 = 2*(dot(-normal,l)) * -normal - l;
                        float s = min(max((100 * (dot(r0,v))-99),0),1);

                        vec3 color = s * highlight + (1-s) * ((1-t) * cool + t * warm);

                        return vec4(color,1);


                    }
                    if (data.a == 0) {
                        point = oldPoint;
                        point += .01 * halfway * r.dir;
                        //boxHit(r,hitSpot + lowerBound,halfway,point,normal);
                        break;
                        return vec4(0,1,0,1);
                    }
                    
                }
            }
            else {
                if (i > 0) {
                    break;
                }
                point += .0000005 * r.dir;
            }
        }
    }
    //return Texel(voxelList,uv);
    return vec4(.5,.7,1,1);
}