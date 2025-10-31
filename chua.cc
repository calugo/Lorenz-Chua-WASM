#include<iostream>
#include<cmath>
using namespace std;

double X, Y, Z;
double dt = 1e-4;
double t = 0.0;
double arr[3];

double Xn(double X1,double X2,double X3, double a, double m0, double m1);
double Yn(double X1,double X2,double X3);
double Zn(double X1,double X2,double X3, double b);
double rk(double x, double y, double z, double a, double m0, double m1, double b,  double* arr);
double g1(double X, double m0, double m1);
/////
double g1(double X, double m0, double m1){
    double y;
    y = 2*( abs(X+1.0) - abs(X-1.0) );
    return m1*X + y*(m0-m1)/2.0;
}
//////
double Xn(double X1, double X2, double X3, double a, double m0, double m1){
    return a*( X2 - X1 - g1(X1,m0,m1));
}
/////
double Yn(double X1, double X2, double X3){
    return X1 - X2 + X3;
}
////

double Zn(double X1, double X2, double X3, double b){
    return -b*X2;
}
///
double  rk(double x, double y, double z, double a, double m0, double m1, double b, double* arr){

    double K1[3]; double K2[3]; double K3[3]; double K4[3];
    double DT = dt/6.0;
    //X = x; Y = y; Z = z; 

    K1[0] = Xn(x,y,z,a,m0,m1);
    K1[1] = Yn(x,y,z);
    K1[2] = Zn(x,y,z,b);

    K2[0] = Xn(x+0.5*dt*K1[0],y+0.5*dt*K1[1],z+0.5*dt*K1[2],a,m0,m1);
    K2[1] = Yn(x+0.5*dt*K1[0],y+0.5*dt*K1[1],z+0.5*dt*K1[2]);
    K2[2] = Zn(x+0.5*dt*K1[0],y+0.5*dt*K1[1],z+0.5*dt*K1[2],b);

    K3[0] = Xn(x+0.5*dt*K2[0],y+0.5*dt*K2[1],z+0.5*dt*K2[2],a,m0,m1);
    K3[1] = Yn(x+0.5*dt*K2[0],y+0.5*dt*K2[1],z+0.5*dt*K2[2]);
    K3[2] = Zn(x+0.5*dt*K2[0],y+0.5*dt*K2[1],z+0.5*dt*K2[2],b);
    
    K4[0] = Xn(x+dt*K3[0],y+dt*K3[1],z+dt*K3[2],a,m0,m1);
    K4[1] = Yn(x+dt*K3[0],y+dt*K3[1],z+dt*K3[2]);
    K4[2] = Zn(x+dt*K3[0],y+dt*K3[1],z+dt*K3[2],b);

    x += DT*(K1[0]+2.0*K2[0]+2.0*K3[0]+K4[0]);
    y += DT*(K1[1]+2.0*K2[1]+2.0*K3[1]+K4[1]);
    z += DT*(K1[2]+2.0*K2[2]+2.0*K3[2]+K4[2]);   
    
    arr[0] = x;
    arr[1] = y;
    arr[2] = z;

    return 0;
}
///
 int main(int argc, char** argv){

    
    double xo = atof(argv[1]);
    double yo = atof(argv[2]);
    double zo = atof(argv[3]);
    
    double a = atof(argv[4]);
    double m0 = atof(argv[5]);
    double m1 = atof(argv[6]);
    double b = atof(argv[7]);
    double Tf = atof(argv[8]);
    double dtp = 1e-2; double tp = dtp;

    int N = int(Tf/dtp);
    //cout <<N<<"\n";

    X = xo; Y = yo; Z = zo;    
    arr[0] = xo; arr[1] = yo; arr[2] = zo;

    cout << t <<","<<arr[0]<<","<<arr[1]<<","<<arr[2]<<"\n";
    ////cout << t <<","<<m0<<","<<m1<<","<<b<<"\n";
    while(t<Tf){

        rk( X, Y, Z, a, m0, m1, b, arr);
        X = arr[0]; Y = arr[1]; Z = arr[2];
        t+=dt;
        if (t>=tp){
            cout << t <<","<<arr[0]<<","<<arr[1]<<","<<arr[2]<<"\n";
            tp+=dtp;
        }
    }
}
