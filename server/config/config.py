# server/config/config.py
class Config:
    HOST = '0.0.0.0'
    PORT = 8080
    DEBUG = True
    CORS_ORIGINS = [
        "http://localhost:4321",
        "http://main-alb-643848986.us-east-2.elb.amazonaws.com"
    ]