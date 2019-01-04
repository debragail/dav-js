FROM python:3.4-alpine
ADD . /code
WORKDIR /code
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
ARG buildno
ARG gitcommithash
RUN echo "Build number: $buildno"
RUN echo "Based on commit: $gitcommithash"