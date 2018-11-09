import cv2

def get_frames():
    fps = 5 # targeting 5FPS
    vidcap = cv2.VideoCapture('data/IMG_0182.MOV')
    skip = round(vidcap.get(cv2.CAP_PROP_FPS)/fps)

    frames = list()
    frameid = -1
    count = 0
    while True:

        success, image = vidcap.read()
        if not success:
            break
        frameid += 1
        if frameid % skip == 0:
            image = cv2.resize(image, (int(640), int(360)))
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            cv2.imwrite("data/5fps/frame%d.jpg" % count, image)     # save frame as JPEG file
            frames.append(image)
            count += 1
    print(count)

    return frames

get_frames()