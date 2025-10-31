#include<iostream>
#include<cmath>
using namespace std;

double X, Y, Z;
double dt = 1e-4;
double t = 0.0;
double arr[3];

double Xn(double X1,double X2,double X3, double sk);
double Yn(double X1,double X2,double X3, double rk);
double Zn(double X1,double X2,double X3, double bk);
double rk(double x, double y, double z, double s, double r, double b, double* arr);

/////
double Xn(double X1, double X2, double X3, double sn){
    return sn*( X2 - X1 );
}
/////
double Yn(double X1, double X2, double X3, double rn){
    return X1*(rn - X3) - X2;
}
////

double Zn(double X1, double X2, double X3, double bn){
    return X1*X2 -  bn*X3;
}
///
double  rk(double x, double y, double z, double s, double r, double b, double* arr){

    double K1[3]; double K2[3]; double K3[3]; double K4[3];
    double DT = dt/6.0;
    //X = x; Y = y; Z = z; 

    K1[0] = Xn(x,y,z,s);
    K1[1] = Yn(x,y,z,r);
    K1[2] = Zn(x,y,z,b);

    K2[0] = Xn(x+0.5*dt*K1[0],y+0.5*dt*K1[1],z+0.5*dt*K1[2],s);
    K2[1] = Yn(x+0.5*dt*K1[0],y+0.5*dt*K1[1],z+0.5*dt*K1[2],r);
    K2[2] = Zn(x+0.5*dt*K1[0],y+0.5*dt*K1[1],z+0.5*dt*K1[2],b);

    K3[0] = Xn(x+0.5*dt*K2[0],y+0.5*dt*K2[1],z+0.5*dt*K2[2],s);
    K3[1] = Yn(x+0.5*dt*K2[0],y+0.5*dt*K2[1],z+0.5*dt*K2[2],r);
    K3[2] = Zn(x+0.5*dt*K2[0],y+0.5*dt*K2[1],z+0.5*dt*K2[2],b);
    
    K4[0] = Xn(x+dt*K3[0],y+dt*K3[1],z+dt*K3[2],s);
    K4[1] = Yn(x+dt*K3[0],y+dt*K3[1],z+dt*K3[2],r);
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
    
    double sigma = atof(argv[4]);
    double rho = atof(argv[5]);
    double beta = atof(argv[6]);
    double Tf = atof(argv[7]);
    double dtp = 1e-2; double tp = dtp;

    int N = int(Tf/dtp);
    cout <<N<<"\n";

    X = xo; Y = yo; Z = zo;    
    arr[0] = xo; arr[1] = yo; arr[2] = zo;

    cout << t <<","<<arr[0]<<","<<arr[1]<<","<<arr[2]<<"\n";




    while(t<Tf){

        rk( X, Y, Z, sigma, rho, beta, arr);
        X = arr[0]; Y = arr[1]; Z = arr[2];
        t+=dt;
        if (t>=tp){
            cout << t <<","<<arr[0]<<","<<arr[1]<<","<<arr[2]<<"\n";
            tp+=dtp;
        }
    }
}
