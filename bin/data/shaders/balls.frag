// Uniforms sent from main openframworks app
uniform vec3  iResolution;              // Resolution of openframeworks app
uniform float iGlobalTime;              // Time the app has been running for
uniform vec4  iMouse;                   // Mouse positiom

uniform sampler2D iChannel0;            // Texture #1
uniform sampler2D iChannel1;            // Texture #2
uniform sampler2D iChannel2;            // Texture #3
    
uniform int  iRandomSphere;             // Current sphere that we are searching for

uniform float targetX;                  // X position we want to move the camera to
uniform float targetY;                  // Y position we want to move the camera to
uniform float targetZ;                  // Z position we want to move the camera to
 
uniform float rotationX;                // Camera rotation around X
uniform float rotationY;                // Camera rotation around Y

#define GRID_SIZE 181                   // Size of the grid we will draw (181 * 181 ) ~= 32768

#define MAX_SCENE_DRAW_HEIGHT 50.0      // Y culling distance

#define render_steps 256                // Amount of steps used in ray marching algorithm for drawing scene

#define PI 3.1415926535897932

// Rotate around the z axis
vec3 rotate_z(vec3 v, float angle)
{
    float ca = cos(angle); float sa = sin(angle);
    return v*mat3(
        +ca, -sa, +.0,
        +sa, +ca, +.0,
        +.0, +.0,+1.0);
}

// Rotate around the y axis
vec3 rotate_y(vec3 v, float angle)
{
    float ca = cos(angle); 
    float sa = sin(angle);

    return v*mat3(
        +ca, +.0, -sa,
        +.0,+1.0, +.0,
        +sa, +.0, +ca);
}

// Rotate around the x axis
vec3 rotate_x(vec3 v, float angle)
{
    float ca = cos(angle); 
    float sa = sin(angle);

    return v*mat3(
        +1.0, +.0, +.0,
        +.0, +ca, -sa,
        +.0, +sa, +ca);
}

// Rotate 2d vector around angle
void rotate(inout vec2 v, const float angle)
{
    float cs = cos(angle), ss = sin(angle);
    v = vec2(cs*v.x + ss*v.y, -ss*v.x + cs*v.y);
}

// Get sphere at position
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

// Get floor at position
float flr(vec3 p)
{
    return p.y+1.0;
}

//distance function
float dist(vec3 p)
{
    float t = iGlobalTime+4.0;
    float d = 1000.0;//p.y+2.0;
    
    d = min(spheres(p),flr(p));
    
    return d;
}

// Calculate ambient occlusion
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

//returns the normal, uses the distance function
vec3 normal(vec3 p,float e) 
{
    float d=dist(p);
    return normalize(vec3(dist(p+vec3(e,0,0))-d,dist(p+vec3(0,e,0))-d,dist(p+vec3(0,0,e))-d));
}

// render background
vec3 background(vec3 p,vec3 d)
{
    // Make a shade between blue and yellow
    vec3 color = mix(vec3(.9,.6,.2),vec3(.1,.4,.8),d.y*.5+.5);
   
    return color*(.5+.5*texture2D(iChannel2,d.xz*.01).xyz)*.75;
    
}

//computes the material for the object
vec3 object_material(vec3 p, vec3 d, out float alpha) 
{
    vec3 n = normal(p,.02);             // normal vector
    vec3 r = reflect(d,n);              // reflect vector
    float ao = amb_occ(p);              // fake ambient occlusion
    vec3 color = vec3(.0,.0,.0);        // variable to hold the color
    float reflectance = 1.0+dot(d,n);
    
    float or = 1.0;
    for (int i=-2; i<5; i++)
    {
        float fi = float(i);
        float e = pow(1.4,fi);
        or = min(or,dist(p+r*e)/e);
    }

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
        
        float od=1.0;
        
        for (int i=1; i<15; i++)
        {
                float fi = float(i);
                float e = fi*.5;
                od = min(od,dist(p+ld*e)/e);
        }
        
        od = max(od,.0);
        
        vec3 icolor = vec3(2.0)*diffuse*od/(attenuation*.125);
        diffuse_acc += icolor;
    }
    
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

        // Check if sphere is inside the search space
        if( p.x > -362.0 && p.x < 362.0 &&
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
    
    float t = 0.0;

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