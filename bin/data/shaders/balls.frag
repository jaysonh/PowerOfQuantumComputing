// Shadertoy uniforms
uniform vec3 iResolution;
uniform float iGlobalTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0; // Texture #1
uniform sampler2D iChannel1; // Texture #2
uniform sampler2D iChannel2; // Texture #3
uniform sampler2D iChannel3; // Texture #4
uniform vec4 iDate;
uniform int  iRandomSphere;

uniform float targetX;
uniform float targetY;
uniform float targetZ;

uniform int textureWidth;
uniform int textureHeight;

uniform vec3  sphereOffset;
uniform float minX;
uniform float maxX;

uniform float rotationY;
uniform float rotationX;

#define GRID_SIZE 181

#define occlusion_enabled
#define occlusion_pass1_quality 40
#define occlusion_pass2_quality 8

#define noise_use_smoothstep

#define object_count 8
#define object_speed_modifier 1.0

#define MAX_SCENE_DRAW_HEIGHT 50.0

#define render_steps 256 

// @appas  noise function from stackoverflow.xom
float snoise(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

mat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}
float noise( in vec2 x ){return texture2D(iChannel0, x*.01).x;}

mat2 m2 = mat2( 0.80,  0.60, -0.60,  0.80 );

const float PI = 3.1415926535897932;
const float speed = 0.2;
const float speed_x = 0.3;
const float speed_y = 0.3;

const float emboss = 0.50;
const float intensity = 2.4;
const int steps = 8;
const float frequency = 6.0;
const int angle = 7;

const float delta = 60.;
const float intence = 700.;

const float reflectionCutOff = 0.012;
const float reflectionIntence = 200000.;



float time = iGlobalTime*1.3;

  float col(vec2 coord)
  {
    float delta_theta = 2.0 * PI / float(angle);
    float col = 0.0;
    float theta = 0.0;
    for (int i = 0; i < steps; i++)
    {
      vec2 adjc = coord;
      theta = delta_theta*float(i);
      adjc.x += cos(theta)*time*speed + time * speed_x;
      adjc.y -= sin(theta)*time*speed - time * speed_y;
      col = col + cos( (adjc.x*cos(theta) - adjc.y*sin(theta))*frequency)*intensity;
    }

    return cos(col);
  }


vec3 rotate_z(vec3 v, float angle)
{
    float ca = cos(angle); float sa = sin(angle);
    return v*mat3(
        +ca, -sa, +.0,
        +sa, +ca, +.0,
        +.0, +.0,+1.0);
}

vec3 rotate_y(vec3 v, float angle)
{
    float ca = cos(angle); float sa = sin(angle);
    return v*mat3(
        +ca, +.0, -sa,
        +.0,+1.0, +.0,
        +sa, +.0, +ca);
}

vec3 rotate_x(vec3 v, float angle)
{
    float ca = cos(angle); float sa = sin(angle);
    return v*mat3(
        +1.0, +.0, +.0,
        +.0, +ca, -sa,
        +.0, +sa, +ca);
}

void rotate(inout vec2 v, const float angle)
{
    float cs = cos(angle), ss = sin(angle);
    v = vec2(cs*v.x + ss*v.y, -ss*v.x + cs*v.y);
}

float spheres(vec3 p)
{
    // Need to get indx here

    p.y -= 1.0 ;
    vec3 p2 = p;



    p2.xz = mod(p.xz+2.0,4.0)-2.0;
    vec2 idx = p.xy-p2.xy;
    p2.xz += sin(idx*34.91)*.5;
    
    return length(p2)-1.0;  
}

float flr(vec3 p)
{
    return p.y+1.0;
}

float dist(vec3 p)//distance function
{
    float t = iGlobalTime+4.0;
    float d = 1000.0;//p.y+2.0;
    
    d = min(spheres(p),flr(p));
    
    return d;
}

float amb_occ(vec3 p)
{
    float acc=0.0;
    #define ambocce 0.2

    acc+=dist(p+vec3(-ambocce,-ambocce,-ambocce));
    acc+=dist(p+vec3(-ambocce,-ambocce,+ambocce));
    acc+=dist(p+vec3(-ambocce,+ambocce,-ambocce));
    acc+=dist(p+vec3(-ambocce,+ambocce,+ambocce));
    acc+=dist(p+vec3(+ambocce,-ambocce,-ambocce));
    acc+=dist(p+vec3(+ambocce,-ambocce,+ambocce));
    acc+=dist(p+vec3(+ambocce,+ambocce,-ambocce));
    acc+=dist(p+vec3(+ambocce,+ambocce,+ambocce));
    return 0.5+acc /(16.0*ambocce);
}

vec3 normal(vec3 p,float e) //returns the normal, uses the distance function
{
    float d=dist(p);
    return normalize(vec3(dist(p+vec3(e,0,0))-d,dist(p+vec3(0,e,0))-d,dist(p+vec3(0,0,e))-d));
}

vec3 background(vec3 p,vec3 d)//render background
{
    //d=rotate_z(d,-1.0);
    vec3 color = mix(vec3(.9,.6,.2),vec3(.1,.4,.8),d.y*.5+.5);
   
    return color*(.5+.5*texture2D(iChannel2,d.xz*.01).xyz)*.75;
    
}

vec3 object_material(vec3 p, vec3 d, out float alpha) //computes the material for the object
{
    vec3 n = normal(p,.02); //normal vector
    vec3 r = reflect(d,n); //reflect vector
    float ao = amb_occ(p); //fake ambient occlusion
    vec3 color = vec3(.0,.0,.0); //variable to hold the color
    float reflectance = 1.0+dot(d,n);
    
    float or = 1.0;
    for (int i=-2; i<5; i++)
    {
        float fi = float(i);
        float e = pow(1.4,fi);
        or = min(or,dist(p+r*e)/e);
    }
    //or = or*.5+.5;
    or = max(or,.0);
    
    vec3 diffuse_acc = background(p,n)*ao;
    float mult = 4.0;
    int randSphereY = (iRandomSphere / GRID_SIZE) - (GRID_SIZE/2);
    vec4 randSphereX = mod(vec4(iRandomSphere),vec4(GRID_SIZE)) - vec4(GRID_SIZE/2)  ;
  
    float indxX = float(randSphereX.x);
    float indxY = float(randSphereY)  ;
    float offX1 = indxX * mult;
    float offZ1 =  indxY * mult;

    vec3 offs = vec3(offX1, 10.0, offZ1);

        vec3 lp = offs;
        vec3 ld = normalize(lp-p);
        
        float attenuation = distance(lp,p);
        
        float diffuse = dot(ld,n);
        
    for (int i=0; i<3; i++)
    {
        float fi = float(i);
        
        

        
        float od=.0;
        
            od = 1.0;
            for (int i=1; i<15; i++)
            {
                float fi = float(i);
                float e = fi*.5;
                od = min(od,dist(p+ld*e)/e);
            }
           // od = od*.5+.5;
            od = max(od,.0);
        
        
        vec3 icolor = vec3(2.0)*diffuse*od/(attenuation*.125);
        diffuse_acc += icolor;
    }
    
    //return vec3(diffuse_acc*.5);
    alpha = 1.0;
    offX1 = -2.0 + indxX * mult;

    offZ1 = -2.0 + indxY * mult;
    if(spheres(p)<flr(p) )
    {

        vec3 tp = p;
        vec3 tn = n;
        vec3 tex = vec3(.5);

        
        float offZ2 =  2.0 + indxY * mult;
        float offX2 =  2.0 + indxX * mult;

        

        color = vec3(0,0,0);
        if(p.x > -362.0 && p.x < 362.0 &&
           p.z > -362.0 && p.z < 362.0    )
        {
                
            tex = vec3(1.0, 0.0, 1.0);
            
            if(p.x > offX1 && p.x < offX2 &&
               p.z > offZ1 && p.z < offZ2    )
                tex = vec3(0.0, 1.0, 1.0);
            

            vec3 stex = pow(tex,vec3(5.0));
            stex*=8.0;
            color = tex*diffuse_acc + stex*background(p,r)*(.1+or*reflectance)*1.8;
        }

        

        
    }else{
        // floor colour

        // Grid 
        vec3 tex = texture2D(iChannel1,mod(p, vec3(1.0)).xz).xyz ;
        color = tex*diffuse_acc+background(p,r)*(.1+or*reflectance)*1.5;
    }

    
    return color*min(ao*1.9,1.0)*.8;
    //return color;
}



void main(void)
{
    vec2 uv = gl_FragCoord.xy / iResolution.xy - 0.5;
    uv.x *= iResolution.x/iResolution.y; //fix aspect ratio
    vec3 mouse = vec3(iMouse.xy/iResolution.xy - 0.5,iMouse.z-.5);
    
    float t = 0.0;//iGlobalTime*.5*object_speed_modifier + 30.0;
    mouse += vec3(sin(t)*.05,sin(t)*.01,.0);
    
    float offs0=5.0;
    float offs1=1.0;
    
    

    //setup the camera
    vec3 p = vec3(0,0.0,-1.0);
    p = rotate_x(p,rotationX);


    p.x = targetX;
    p.z = targetZ;
    p.y = targetY;


    vec3 d = vec3(uv,1.0);
    d.z -= length(d)*0.3;//0.6; //lens distort
    d = normalize(d);

    d = rotate_x(d,mouse.y* 4.0 *PI);
    d = rotate_y(d,rotationY);
    p.y += 3.5;

    
    vec3 sp = p;
    vec3 color;
    float dd,td;
    
    //raymarcing 
    for (int i=0; i<render_steps; i++)
    {
        dd = dist(p);
        p+=d*dd;
        td+=dd;
        if (dd> MAX_SCENE_DRAW_HEIGHT ) break;
    }
    
    float alpha = 1.0;
    if (dd<0.1)
    {
        color = object_material(p,d,alpha);

    }
    else
    {
        color = background(p,d);
    }
    
    color = mix(background(p,d),color,1.0/(td*.03+1.0));
    color = (color-vec3(.01,.01,.01))* vec3(3.0,3.5,3.5);
    
    color *= (1.0-length(uv)*0.5);

    gl_FragColor = vec4(color.xyz,1.0);//vec4(pow(color,vec3(1.0/2.2)),alpha);
}