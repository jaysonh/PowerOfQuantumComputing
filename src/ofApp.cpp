#include "ofApp.h"

//--------------------------------------------------------------
void ofApp::setup(){
    
    searchSphere = pow(2,15) / 2;
    
    ofBackground(255);
    ofDisableArbTex();
    counter = 0;
    
    shaderNames.push_back("balls");
    
    
    ofHideCursor();
    shaderFbo.allocate(ofGetWidth(),ofGetHeight());
    
    targetDist = 0.0;
    
    rotationX = 0.0;
    rotationY = 0.0;
    
    shader.load("shaders/" + shaderNames[counter]);
    
    img.loadImage("textures/checkerboardsmall.png");
    img.resize(ofGetWidth(),ofGetHeight());
    
    
    minX = -0.26;
    maxX = 2.0;
    targetX = 0.0;
    targetZ = 0.0;
    targetY = 0.0;
    sphereOffset = ofVec3f(0.0,0.0,0.0);
    
    intro  = true;
    
    cameraPos = ofVec3f(0.0, 50.5, 0.0);
    
    font.loadFont("fonts/Montserrat-UltraLight.otf", 60);
    
    loading=false;
    
    lastTime = ofGetElapsedTimef();
}

void ofApp::resetAlgorithm()
{
    searchSphere = (int)ofRandom(0, 32000);
    float mult = 4.0;
    int GRID_SIZE = 181;
    
    int randSphereY = (searchSphere / GRID_SIZE) - (GRID_SIZE/2);
    int randSphereX = (searchSphere % GRID_SIZE) - (GRID_SIZE/2)  ;
    
    float indxX = float(randSphereX);
    float indxY = float(randSphereY)  ;
    
    
    float lastX = targetX;
    float lastZ = targetZ;
    
    targetX =  indxX * mult;
    targetZ =  indxY * mult;
    
    ofVec2f dir = ofVec2f(targetX - lastX, targetZ - lastZ);
    
    targetDist = dir.length();
    
    dir.normalize();
    
    dir.x *= mult * 2.0;
    dir.y *= mult * 2.0;
    
    targetX -= dir.x;
    targetZ -= dir.y;
    
    targetRotationY = atan2(dir.y , dir.x) -PI/2 ;
    mIteration = 0;
    
    
    quantumSim.startSearchAlgorithm(searchSphere);
    
  
    
}

//--------------------------------------------------------------
void ofApp::update(){
    
}


//--------------------------------------------------------------
void ofApp::draw(){
    
   // printf("mouse: %i %i\n", ofGetMouseX(), ofGetMouseY());
    ofVec3f diff = ofVec3f( targetX - cameraPos.x,
                            targetY - cameraPos.y,
                            targetZ - cameraPos.z);
    
    float percentageThere = diff.length() / targetDist;
    
    if(loading)
    {
        ofBackground(0);
        
        ofSetColor(255);
        
        string spaces = "";
        
        for(int i = 0; i < (ofGetFrameNum()/30)%5; i++)
            spaces += ".";
        font.drawString("preparing quantum simulator" + spaces, 180, 450);
        
        /*if(ofGetElapsedTimef() - lastTime > 4.0)
        {
            loading = false;
            lastTime = ofGetElapsedTimef();
        }*/
    }else
    {
        if(intro)
        {
            rotationY += 0.025;
            if(rotationY > TWO_PI*0.75 )
            {
                rotationY = TWO_PI*0.75;
                targetRotationY =TWO_PI * 0.75;
                intro = false;
            }
            
        }else{
            float angleDiff = targetRotationY - rotationY;
            
            rotationY += angleDiff * 0.025;

        }
        
       
        
        if(targetDist > 0.0)
            targetY = sin(percentageThere * PI) * 20.0;
        
        cameraPos.x += diff.x * 0.025;
        cameraPos.y += diff.y * 0.025;
        cameraPos.z += diff.z * 0.025;
        
        
        ofSetWindowTitle(ofToString(ofGetFrameRate()));
        
        ofTexture shaderTex = img.getTexture();//shaderFbo.getTexture();
        
        shaderFbo.begin();
        
        
        shader.begin();
        shader.setUniform3f("iResolution", 1280,720, 0.0);
        shader.setUniform1f("iGlobalTime", ofGetElapsedTimef());
        shader.setUniform1i("iRandomSphere", searchSphere);//(int)ofRandom(0,32768) );
        
        
        
        if(ofGetMousePressed())
        {
            
            rotationY +=ofMap(ofGetMouseX() - ofGetPreviousMouseX(), -ofGetWidth(), ofGetWidth(),-PI,PI);
            
            targetRotationY = rotationY;
        }
        
        ofSoundBuffer b;
        
        shader.setUniformTexture("iChannel0",shaderTex,1);
        shader.setUniformTexture("iChannel1",shaderTex,1);
        shader.setUniformTexture("iChannel2",shaderTex,1);
        shader.setUniformTexture("iChannel3",shaderTex,1);
        shader.setUniform1i("textureWidth", 800);
        shader.setUniform1i("textureHeight", 800);
        shader.setUniform1f("minX", minX);
        shader.setUniform1f("maxX", maxX);
        
        
        shader.setUniform4f("iDate", ofGetYear(), ofGetMonth(), ofGetDay(), ofGetSeconds());
        shader.setUniform3f("sphereOffset", sphereOffset.x, sphereOffset.y, sphereOffset.z);
      
        
        shader.setUniform1f("targetX", cameraPos.x);
        shader.setUniform1f("targetY", cameraPos.y);
        shader.setUniform1f("targetZ", cameraPos.z);
        shader.setUniform1f("rotationX", rotationX);
        shader.setUniform1f("rotationY", rotationY);
        
        
        ofRect(0,0, ofGetWidth(), ofGetHeight());
        shader.end();
        
        shaderFbo.end();
        
        ofPushMatrix();
        ofScale(1.0,-1.0,1.0);
        shaderFbo.draw(0,-ofGetHeight());
        ofPopMatrix();
    }
  

    ofImage img;
    img.grabScreen(0,0,ofGetWidth(),ofGetHeight());
    img.save(ofToString(ofGetFrameNum()) + ".jpg");
}

//--------------------------------------------------------------
void ofApp::keyReleased(int key){
    
    if(key=='1')
        loading = false;
    
    if (key == ' ')
    {
        resetAlgorithm();
        
        loading=false;
    }
    
    if(key=='l')
    {
        shader.load("shaders/" + shaderNames[counter]);
    }
    
    if(key== 'a')
    {
        searchSphere++;
        printf("search sphere: %i\n", searchSphere);
    }if(key== 's')
    {
        searchSphere--;
        if(searchSphere < 0)
            searchSphere =0;
        printf("search sphere: %i\n", searchSphere);
    }
    
    
    printf("x: %f y: %f z: %f\n", sphereOffset.x, sphereOffset.y, sphereOffset.z);
}

//--------------------------------------------------------------
void ofApp::mouseMoved(int x, int y ){
    
    draggedX = x * .01;
    draggedY = y * .01;
    
}

//--------------------------------------------------------------
void ofApp::mouseDragged(int x, int y, int button){
    
}

//--------------------------------------------------------------
void ofApp::mousePressed(int x, int y, int button){
    
    clickX = x;
    clickY = y;
    
}

//--------------------------------------------------------------
void ofApp::mouseReleased(int x, int y, int button){
    
}

//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){
    
}

//--------------------------------------------------------------
void ofApp::gotMessage(ofMessage msg){
    
}

//--------------------------------------------------------------
void ofApp::dragEvent(ofDragInfo dragInfo){
    
}
