

#pragma once

#include "ofMain.h"
#include "ofxQuantumGroversSearch.h"

class ofApp : public ofBaseApp{
    
public:
    void setup();
    void update();
    void draw();
    
    
    void keyReleased(int key);
    void mouseMoved(int x, int y );
    void mouseDragged(int x, int y, int button);
    void mousePressed(int x, int y, int button);
    void mouseReleased(int x, int y, int button);
    void windowResized(int w, int h);
    void dragEvent(ofDragInfo dragInfo);
    void gotMessage(ofMessage msg);
    
    
    void resetAlgorithm();
    
    ofShader shader;
    ofImage img;
    int draggedX, draggedY, clickX, clickY;
    std::vector<string> shaderNames;
    int counter;
    
    ofxQuantumGroversSearch quantumSim;
    
    int searchSphere ;
    bool intro;
    float minX;
    float maxX;
    
    ofVec3f sphereOffset;
    
    ofFbo shaderFbo;
    float targetX,targetZ,targetY;
    
    float targetRotationY;
    ofVec3f cameraPos;
    
    float rotationY;
    float rotationX;
    float targetDist;
    
    ofTrueTypeFont font;
    bool loading;
    int mIteration;
    
    float lastTime;
};