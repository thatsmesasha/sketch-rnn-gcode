categories=(
alarm_clock.gen.json
angel.gen.json
ant.gen.json
backpack.gen.json
barn.gen.json
basket.gen.json
bee.gen.json
bicycle.gen.json
book.gen.json
cactus.gen.json
calendar.gen.json
castle.gen.json
cat.gen.json
chair.gen.json
crab.gen.json
eye.gen.json
face.gen.json
fan.gen.json
flower.gen.json
hedgehog.gen.json
helicopter.gen.json
key.gen.json
lighthouse.gen.json
mosquito.gen.json
paintbrush.gen.json
palm_tree.gen.json
peas.gen.json
penguin.gen.json
pig.gen.json
pineapple.gen.json
postcard.gen.json
radio.gen.json
rain.gen.json
sheep.gen.json
snail.gen.json
snowflake.gen.json
spider.gen.json
strawberry.gen.json
toothbrush.gen.json
truck.gen.json
windmill.gen.json
)

mkdir models
for i in "${categories[@]}"
do
  :
  echo "Downloading $i ..."
  if [ ! -f models/$i ]
  then
    wget "https://storage.googleapis.com/quickdraw-models/sketchRNN/large_models/$i" -O models/$i
  fi
done
