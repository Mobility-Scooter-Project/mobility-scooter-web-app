# Mobility Scooter Video API
This API is designated for processing videos from the mobility scooter web app.

## Get Started
Before you begin, make sure you have python>=3.10 installed, as well as poetry and ffmpeg. 
Make sure to have docker-compose up and the development server running.

To install all dependencies:
```
poetry install
```
To run the dev server:
```
cd /src && fastapi dev main.py
```

# PyTorch CUDA Re-install
Adding Ultralytics, which is used for loading the YOLO model, to Poetry automatically installs torch and torchvision that are not compatible with GPU computation. 

Uninstall them: pip3 uninstall torch torchvision
Then install: pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu128.


# Whisper defaults to CPU instead of utilizing Nvidia GPU on Windows 11
For windows, I had to install an Nvidia triton windows compiler build from here : https://huggingface.co/madbuda/triton-windows-builds
Command:
pip install https://huggingface.co/madbuda/triton-windows-builds/resolve/main/triton-3.0.0-cp312-cp312-win_amd64.whl

If you have CUDA 12.6 or higher, this bugfix needs to be applied also:

@functools.lru_cache()
def ptx_get_version(cuda_version) -> int:
    '''
    Get the highest PTX version supported by the current CUDA driver.
    '''
    assert isinstance(cuda_version, str)
    major, minor = map(int, cuda_version.split('.'))
    if major == 12:
        if minor < 6:
            return 80 + minor
        elif minor >= 6:
            return 80 + minor - 1
    if major == 11:
        return 70 + minor
    if major == 10:
        return 63 + minor
    raise RuntimeError("Triton only support CUDA 10.0 or higher, but got CUDA version: " + cuda_version)

For me, the file I had to edit was located in
C:\Users\tdang\AppData\Local\pypoetry\Cache\virtualenvs\video-api-4vpKAgAG-py3.12\Lib\site-packages\triton\backends\nvidia\compiler.py

After this and doing the pytorch CUDA re-install, it worked for Windows.