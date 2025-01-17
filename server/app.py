import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import init_app
from config import Config

if __name__ == "__main__":
    config = Config()
    app = init_app(config)
    app.run(debug=True)
