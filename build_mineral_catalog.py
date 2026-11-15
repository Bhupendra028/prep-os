import json,os,re,csv
from collections import OrderedDict
p='/mnt/data/fitos_work/assets/mineral-foods.js'
items=[]

def food(name,portion,unit,macro=None,micro=None,group=None,aliases=None,note=''):
    # Macros are broad generic estimates for the stated edible serving, not measured nutrient analyses.
    obj=OrderedDict(food=name,portion=portion,unit=unit)
    keys=['calories','protein','carbs','fat','fibre']
    if macro:
        for k,v in zip(keys,macro):obj[k]=v
    if micro:
        for k,v in micro.items():obj[k]=v
    obj['category']='Mineral-rich foods'
    obj['mineral_tags']=group or ''
    obj['aliases']=', '.join(aliases or [])
    obj['source']='YouTube mineral-food screenshots · food list and approximate per-serving mineral values; other nutritional values are generic estimates, not verified labels'
    obj['notes']=('Mineral values from the supplied video screenshots where stated; may vary by preparation/brand. '+note).strip()
    obj['catalog_id']='mineral-'+re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
    items.append(obj)

# Potassium reference photos
food('Potato, baked with skin',200,'g',[186,5,42,0.2,4.4],{'potassium':919},'Potassium', ['baked potato','aloo'])
food('Rajma / kidney beans, cooked',170,'g',[216,15,39,0.9,11],{'potassium':900,'magnesium':120},'Potassium, magnesium, iron, copper', ['rajma','kidney beans'], 'Cup/serving varies; video groups legume iron and copper amounts rather than measuring rajma alone.')
food('Spinach / palak, cooked',180,'g',[42,5.3,6.8,0.5,4.3],{'potassium':840,'magnesium':157,'iron':6.4},'Potassium, magnesium, iron', ['palak','spinach'], 'Spinach oxalates can limit mineral absorption.')
food('Sweet potato, cooked',200,'g',[180,4,41,0.3,6.6],{'potassium':700},'Potassium',['shakarkand','sweet potato'])
food('Avocado, whole edible flesh',200,'g',[320,4,17,29.4,13.4],{'potassium':700,'copper':0.38},'Potassium, copper',['avocado'], 'Fruit size differs; weigh edible flesh.')
food('Salmon, cooked fillet',150,'g',[310,33,0,19,0],{'potassium':675},'Potassium, selenium',['salmon'], 'Mineral data for selenium vary by salmon species.')
food('Chana / chickpeas, cooked',170,'g',[278,15,46,4.4,12.8],{'potassium':620},'Potassium, iron, copper',['kabuli chana','chickpeas'])
food('Coconut water, plain',240,'ml',[45,1,11,0,0],{'potassium':600},'Potassium',['nariyal pani'], 'Potassium content varies by brand and coconut.')
food('Banana, 2 medium',2,'medium',[210,2.6,54,0.8,6.2],{'potassium':724},'Potassium, chromium',['banana','kela'], 'Separate from existing per-banana reference.')
food('Curd / yogurt, plain',240,'g',[150,8.5,11,8,0],{'potassium':380,'calcium':300},'Potassium, calcium, selenium',['dahi','yogurt'], 'Curd protein and fat depend on milk used.')

# Magnesium photos
food('Pumpkin seeds',30,'g',[169,9,4.5,14.5,2],{'magnesium':150,'iron':4.2},'Magnesium, iron, copper',['kaddu beej','pepitas'])
food('Black beans, cooked',170,'g',[224,15,41,0.9,15],{'magnesium':120},'Magnesium, iron',['black beans'])
food('Chia seeds',30,'g',[146,5,12.6,9.2,10.3],{'magnesium':111},'Magnesium',['chia'])
food('Edamame / green soybeans, cooked',155,'g',[188,18,14,8,8],{'magnesium':100},'Magnesium, iron',['edamame','soybeans'])
food('Sesame seeds / til',30,'g',[172,5.3,7,14.9,3.5],{'magnesium':100,'calcium':280},'Magnesium, calcium',['til','sesame'])
food('Brown rice, cooked',195,'g',[216,5,45,1.8,3.5],{'magnesium':84,'selenium':19},'Magnesium, selenium',['brown rice'])
food('Almonds',30,'g',[174,6.4,6.5,15,3.7],{'magnesium':80},'Magnesium',['badam'])
food('Cashews',30,'g',[166,5.5,9,13.2,1],{'magnesium':74,'copper':0.28},'Magnesium, copper',['kaju'])
food('Dark chocolate, 70% or higher',30,'g',[180,2.3,14,12.8,3],{'magnesium':65,'iron':3.3,'copper':0.4},'Magnesium, iron, copper',['dark chocolate','70 percent cocoa'], 'Chocolate nutrition depends strongly on cocoa percentage and added sugar.')

# Iron photos
food('Oysters, cooked',85,'g',[85,9,5,2,0],{'iron':13.2,'copper':4.85,'selenium':130},'Iron, copper, selenium',['oysters'], 'Values depend greatly on species and cooking method.')
food('Chicken liver, cooked',85,'g',[142,20,1,5.4,0],{'iron':10.8},'Iron, copper',['chicken liver'], 'Organ meats contain high vitamin A; do not eat large portions routinely.')
food('Beef / red-meat liver, cooked',85,'g',[145,22,4,4,0],{},'Iron, copper',['liver','beef liver'], 'Video reports copper range 7–14 mg per 85 g; no single exact value has been assigned. Extremely high in vitamin A.')
food('Kidney, cooked organ meat',85,'g',[100,17,1,3,0],{},'Iron',['kidney','organ meat'], 'Serving macros depend on animal species.')
food('Heart, cooked organ meat',85,'g',[144,22,0,6,0],{},'Iron',['heart','organ meat'], 'Serving macros depend on animal species.')
food('Clams, cooked',85,'g',[126,22,4,1,0],{'iron':6.3},'Iron',['clams'])
food('Lean red meat, cooked',100,'g',[200,27,0,10,0],{'iron':2.6},'Iron, zinc',['beef lean','red meat'], 'Fat varies by cut; generic estimate.')
food('Dal / lentils, cooked',200,'g',[232,18,40,0.8,16],{},'Iron, copper',['dal','lentils'], 'Video gives group-level legume iron 5–7 mg/cup; no exact dal number has been entered.')

# Copper foods
food('Shiitake mushrooms, cooked',145,'g',[80,2.4,19,0.3,3],{'copper':1.15},'Copper',['shiitake'])
food('Crab meat, cooked',85,'g',[82,17,0,1,0],{'copper':1.3},'Copper, selenium',['crab'], 'Copper is approximate from video group shellfish range 1.3–1.8 mg.')
food('Lobster meat, cooked',85,'g',[78,16,1,0.8,0],{'copper':1.8},'Copper, selenium',['lobster'], 'Copper is approximate from video group shellfish range 1.3–1.8 mg.')
food('Sunflower seeds',30,'g',[175,6,6,15,2.5],{'selenium':19,'copper':0.3},'Selenium, copper',['sunflower seeds'])
food('Whole wheat bread',60,'g',[148,8,26,2.5,4],{'chromium':3},'Chromium',['atta bread','2 slices whole wheat bread'], 'Chromium screenshot gives range 2–4 mcg for 2 slices.')

# Selenium foods
food('Brazil nuts, 2 nuts',10,'g',[66,1.4,1.2,6.7,0.8],{},'Selenium',['brazil nuts'], 'Selenium per nut is EXTREMELY variable; video erroneously equates about 2 nuts to 30 g. Do not rely on a precise selenium amount or consume large quantities daily.')
food('Tuna, cooked',85,'g',[112,25,0,0.8,0],{'selenium':92},'Selenium',['tuna fish'])
food('Sardines with edible bones, cooked',85,'g',[177,21,0,10,0],{'selenium':40,'calcium':250},'Selenium, calcium',['sardines'], 'Calcium depends on whether edible bones are included; 250 mg is within video range 180–325 mg.')
food('Shrimp / prawns, cooked',85,'g',[85,20,0,1,0],{'selenium':40},'Selenium',['prawns','shrimp'], 'Video gives seafood group 35–45 mcg selenium; approximate midpoint.')
food('Turkey breast, cooked',100,'g',[165,29,0,4,0],{'selenium':30},'Selenium',['turkey'], 'Video groups chicken and turkey selenium range 27–32 mcg.')
food('Chicken breast, cooked',100,'g',[165,31,0,3.6,0],{'selenium':30},'Selenium',['chicken','breast'], 'Video groups chicken/turkey selenium 27–32 mcg per 100 g.')
food('Whole eggs, 2',2,'egg',[156,12.6,1.2,10.6,0],{'selenium':30},'Selenium',['eggs','2 eggs'])
food('Oats, cooked in water',240,'g',[150,5,27,2.5,4],{'selenium':16},'Selenium, copper',['oats','porridge'], 'No milk or toppings in these values; whole grains grouped in the screenshot.')
food('Milk, whole',240,'ml',[149,7.7,11.7,8,0],{'calcium':300,'selenium':9},'Calcium, selenium',['milk'], 'Whole milk; toned/skimmed product macros differ.')

# Calcium foods
food('Cheddar / hard cheese',30,'g',[120,7.5,0.4,10,0],{'calcium':330},'Calcium',['cheddar','hard cheese'], 'Cheese type varies; video hard cheese example about 330 mg per 30 g.')
food('Paneer',100,'g',[265,18,3,20,0],{'calcium':200},'Calcium',['paneer','cottage cheese indian'], 'Brands and moisture content vary widely.')
food('Calcium-set tofu',100,'g',[145,15,3.5,8,1],{'calcium':350},'Calcium',['tofu calcium set'], 'Only calcium-set tofu reaches this amount; check ingredients/label.')
food('Fortified plant milk, unsweetened',240,'ml',None,{'calcium':300},'Calcium',['fortified oat milk','fortified soy milk'], 'Fortification and macros vary significantly. Only enter calories/macros from actual product label; 300 mg calcium is illustrative.')
food('Kale, cooked',150,'g',[53,3,10,0.8,4],{'calcium':180},'Calcium',['kale'])
food('Broccoli, cooked',150,'g',[53,4,10,0.6,5],{},'Calcium, chromium',['broccoli'], 'The screenshot groups kale and broccoli; do not assume identical calcium per serving.')
food('Ragi / finger millet flour',40,'g',[134,3,29,1.5,5],{'calcium':145},'Calcium',['ragi','finger millet'])
food('Amaranth / chaulai leaves, cooked',130,'g',[30,3,5,0.4,3],{'calcium':115},'Calcium',['chaulai','amaranth greens'])
food('Anchovies with edible bones',85,'g',[111,25,0,2.5,0],{},'Calcium',['anchovies'], 'Calcium depends on edible bone content; product-specific amount unknown.')
food('Canned salmon with edible bones',85,'g',[140,18,0,7,0],{},'Calcium',['salmon with bones'], 'Calcium depends on edible bone content; product-specific amount unknown.')

# Chromium foods
food('Broccoli, cooked (45 g portion)',45,'g',[16,1.2,3.2,0.2,1.5],{'chromium':11},'Chromium',['broccoli'], 'Specific screenshot serving is 45 g; generic 150 g entry also available.')
food('Grape juice',240,'ml',[151,1,37,0.3,0.3],{'chromium':8},'Chromium',['grape juice'])
food('Potato, mashed',210,'g',[200,4,35,6,3],{'chromium':3},'Chromium',['mashed potatoes','aloo mash'], 'Added butter/milk affect macros; this is a generic approximation.')
food('Garlic, dried',3,'g',[10,0.5,2.3,0,0.3],{'chromium':3},'Chromium',['dry garlic'])
food('Orange juice',240,'ml',[112,1.7,26,0.5,0.5],{'chromium':2},'Chromium',['mosambi juice','orange juice'])
food('Green beans, cooked',65,'g',[23,1.2,5,0.1,2.2],{'chromium':1},'Chromium',['french beans'])
food('Apple with skin',180,'g',[95,0.5,25,0.3,4.5],{'chromium':1},'Chromium',['apple'])
food('Whole wheat flour / atta',60,'g',[204,7.8,43,1.5,6.5],{},'Chromium',['atta','wheat flour'])
food('Mixed leafy greens, cooked',180,'g',None,{},'Potassium, magnesium, calcium',['leafy greens'], 'Species and preparation vary greatly. Enter a specific green or recipe for accurate nutrient values.')

assert len({x['catalog_id'] for x in items})==len(items)
# Order alphabetical for ease of developer changes; keep fixed cat ids
items.sort(key=lambda x:x['food'].lower())
with open(p,'w',encoding='utf-8') as f:
 f.write('/* Fit OS mineral-food catalog. Edit and commit this file to GitHub to refresh managed food references.\n')
 f.write('   Per-serving nutrition is APPROXIMATE (video screenshots + generic food estimates), not measured or clinically verified.\n')
 f.write('   Unknown values are intentionally omitted and must remain Unknown in the diary. */\n')
 f.write('window.FIT_OS_MINERAL_FOODS = '+json.dumps(items,ensure_ascii=False,indent=2)+';\n')
with open('/mnt/data/fitos_work/Mineral_Foods_Catalog.csv','w',newline='',encoding='utf-8-sig') as f:
 fields=['Food','Portion','Unit','Calories','Protein g','Carbs g','Fat g','Fibre g','Calcium mg','Magnesium mg','Potassium mg','Iron mg','Copper mg','Selenium mcg','Chromium mcg','Mineral tags','Notes']
 w=csv.writer(f);w.writerow(fields)
 for a in items:w.writerow([a['food'],a['portion'],a['unit'],*[a.get(k,'') for k in ['calories','protein','carbs','fat','fibre','calcium','magnesium','potassium','iron','copper','selenium','chromium']],a['mineral_tags'],a['notes']])
print('catalog foods:',len(items))
print('macro known:',sum('calories' in x for x in items))
