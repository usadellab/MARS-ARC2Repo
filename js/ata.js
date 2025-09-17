// JSONata mappings and validation checklists for MARS
// Multi-omics Adapter for Repository Submissions

var isaMapping = {
  "getAllENANoneSource": `(
          $ENAassays := $.isa.studies.assays[comments.target_repository = "ENA"];
          $chain:= $ENAassays.dataFiles.\`@id\`
            ~> $map( function($v1, $i1, $a1){
                ($searchSource:= function($outputIdList){
                      $exists($process:=$ENAassays.processSequence.outputs[\`@id\` = $outputIdList[-1]].%) ?
                      $searchSource( $append($outputIdList, $process.inputs.\`@id\`)): $outputIdList
                      };
                      $id:= $searchSource([$v1]);
                      )
                  }
              );
          $edgePoints :=  $distinct($chain.**);
          $process := $edgePoints ~> $map( function($v2, $i2, $a2) {
              { "name":$v2,"attributes":
              $ENAassays.**.processSequence.inputs[\`@id\` = $v2 ].%} });
          $termDict := $.csv{id: \`Field Name\`};
          $valueDict := $.isa.**.value{\`@id\`: annotationValue};
          $processValue := $process.[{
              "name":name, "file": attributes.outputs.\`@id\`,"attributes": attributes.parameterValues.{
                  "id":$replace(category.[\`@id\`][0], /#ProtocolParameter\\/+/, "" ),
                  "enaName": $lookup($termDict[0],$replace(category.[\`@id\`][0], /#ProtocolParameter\\/+/, "" ) )[0],
                  "value": $lookup($valueDict, value.[\`@id\`][0]) }} ]  ;

          $experiments:= $processValue ~> $map(function($v3, $i3, $a3) { {"name":$v3.name, "files":$v3.file, "attr": $v3["Library source" in attributes.enaName].attributes}});
          $analysis:= $processValue ~> $map(function($v3, $i3, $a3) { {"name":$v3.name ,"files":$v3.file, "attr": $v3[ $not("Library source" in attributes.enaName)].attributes}});
          {"experiments":[$experiments[attr]],"analysis": [$analysis[attr]] };
      )`,
  "getUnique": `(
          $ENAassays := $.isa.studies.assays;
          $chain:= $ENAassays.dataFiles.\`@id\`
            ~> $map( function($v1, $i1, $a1){
                ($searchSource:= function($outputIdList){
                      $exists($process:=$ENAassays.processSequence.outputs[\`@id\` = $outputIdList[-1]].%) ?
                      $searchSource( $append($outputIdList, $process.inputs.\`@id\`)): $outputIdList
                      };
                      $id:= $searchSource([$v1]);
                      )
                  }
              );
          $edgePoints :=  $distinct($chain.**);
          )`,
  "getChain": `($ENAassays := $.isa.studies.assays;
          $chain:= $ENAassays.dataFiles.\`@id\`
            ~> $map( function($v1, $i1, $a1){
                ($searchSource:= function($outputIdList){
                      $exists($process:=$ENAassays.processSequence.outputs[\`@id\` = $outputIdList[-1]].%) ?
                      $searchSource( $append($outputIdList, $process.inputs.\`@id\`)): $outputIdList
                      };
                      $id:= $searchSource([$v1]);
                      )
                  }
              );
              $materials := $.isa.studies.materials;
        $sources:= $zip([$materials.samples.\`@id\`],[$materials.sources.\`@id\`] );
        $maps := $sources ~> $map( function($v1, $i1, $a1){
            {$v1[0] : $v1[1]}
        });
        $allchain :=$chain ~> $map( function($v1, $i1, $a1){
            $v1 ~> $append( $lookup($maps, $v1[-1] ))
        })  ;
           $edgePoints :=  $distinct($allchain.**);
        {"allchain": $allchain, "children":$edgePoints}
              )`,
  "getTargetRepo": `$.isa.studies.assays.comments.target_repository`,
  "getEdgelist": `( $js1:= { "investigation": $.isa.identifier,
          "studies": $.isa.studies.{
              "id":\`@id\`, "process": [$zip(materials.[sources.\`@id\`], materials.[samples.\`@id\`])]},
          "assays" : $.isa.studies.assays.{
              "id":\`@id\`, "process": processSequence.[inputs.\`@id\`, outputs.\`@id\`]}
          } ;
      $js2:= $js1.**.process;
      [$js1, $js2]
      )`,
  "getVisjs": `( $js1:= { "investigation": $.isa.identifier,
          "studies": $.isa.studies.{
              "id":\`@id\`, "process": [$zip(materials.[sources.\`@id\`], materials.[samples.\`@id\`])]},
          "assays" : $.isa.studies.assays.{
              "id":\`@id\`, "process": processSequence.[[$zip(inputs.\`@id\`, outputs.\`@id\`)]][0]  }
          } ;
      $sources :=  $.isa.studies.materials.sources.\`@id\`;
      $js2:= $js1.**.process;
      $nodes1 := $distinct($js2.*);
      $nodes := $nodes1 ~> $map(function($v1, $i1, $a1 ) {
          ( $sOrm := $v1 in $sources ? "source" : "material" ;
              {"id": $i1, "label": $v1, "arrows":"to" }
          )} );
      $edges1 := $nodes1 ~> $map(function($v1, $i1, $a1 ) {
          (
            { $v1 : $i1 }
          )} );
      $dict1:= $merge($edges1);
      $edge:= $js2~> $map( function($v2, $i2, $a2){
        {"from": $lookup($dict1,$v2[0] ) , "to": $lookup($dict1,$v2[1] )    }
      } );
      {"nodes": $nodes, "edges": $edge}
      )`,
"getAllTable":`(
    $processObj:= $.isa.studies.processSequence.inputs.{
              \`@id\`: %.parameterValues.([{ "keyId":category.\`@id\`,
                  "keyName":category.parameterName.annotationValue, "valueId":value.\`@id\`, "valueName": value.annotationValue }]) };
    $materials := $.isa.studies.materials;
    $sourceMap:= $zip([$materials.sources.\`@id\`],[$materials.samples.\`@id\`] )~>$map(function($v1, $i1, $ai) {
        {$v1[0]: $v1[1]} } ) ~> $merge;
    $sources := [
        $.isa.studies.materials.sources.{
        "id": \`@id\`,
          "level":"studies",
          "parentName": %.%.\`@id\`,
          "name": name,
          "output": $sourceMap~>$lookup(\`@id\`),
          "submission": comments.submission,
          "target_repository": "BioSamples",
          "characteristics": characteristics.
          ([{ "key" : ($substringAfter(
              \`@id\`, "#MaterialAttributeValue/")~>$split("="))[0],
              "value":($substringAfter( \`@id\`, "#MaterialAttributeValue/")~>
              $split("="))[1]}]),
          "parameters":  $processObj ~> $lookup(\`@id\`)
          }];
    $;
    $processes :=[
          $.isa.studies.assays.processSequence.{
          "id": \`@id\`,
          "level":"assays",
          "parentName": %.\`@id\`,
          "name":name,
          "submission":comments.submission,
          "target_repository":%.comments.target_repository ?%.comments.target_repository  : "not provided",
          "inputs": inputs.\`@id\`,
          "outputs": outputs.\`@id\`,
          "parameters":  parameterValues.([{ "keyId":category.\`@id\`,
          "keyName":category.parameterName.annotationValue, "valueId":value.\`@id\`, "valueName": value.annotationValue }])
        }];
    {"sources" : $sources, "processes": $processes};

        )`

}

var checklist_biosamples = [
  {
    "description": "Checking if an investigation exists as a wrapper",
    "key": "investigation",
    "jsonata": "$.$keys()",
    "error": "element.key + \" cannot be found in\" element.jsonata",
    "fixfunction": '{"investigation":$}'
  },
  {
    "description": "Checking if studies exist",
    "key": "studies",
    "jsonata": "$.investigation.$keys()",
    "error": "element.key + \" cannot be found in\" element.jsonata",
    "fixfunction": '$~>| $.investigation| {"studies":"missing_key"} |'
  },
  // {
  //   "description" : "Checking if assays exist",
  //   "key": "assays",
  //   "jsonata": "$.investigation.studies[0].$keys()",
  //   "error": "element.key + \" cannot be found in\" element.jsonata",
  //   "fixfunction": '$assert($.investigation.studies.$keys(), "error, no assays in studies")'
  // },

  {
    "description": "Check if organisms are added to the $.investigation.studies.materials.sources.characteristics ",
    "jsonata": '$assert($boolean($.investigation.studies.materials.sources.characteristics."@id"[$contains("organism=")].%.category."@id".$not($contains("organism"))).$not(), "error. Organism is not found" )',
    "fixfunction": '$~> |$.investigation.studies.materials.sources.characteristics."@id"[$contains("organism=")].%|   {"category":{"@id": "#MaterialAttribute/organism/OBI:0100026" }} |'
  },
  {
    "description": "Checking if organisms exist in the ids in characteristicCategories",
    "jsonata": '$assert($boolean($.**.`@id`.$contains("#MaterialAttribute/OBI:0100026")).$not() , "error, no organisms in characteristicCategories")',
    "fixfunction": '$~>| $.**[`@id`="#MaterialAttribute/OBI:0100026"]|  {"@id":"#MaterialAttribute/organism/OBI:0100026"}  |'
  },
  {
    "description": "Checking if multiple studies exist. Only the first will be selected if there are no submission specifications",
    "jsonata": '$assert ($count($.investigation.studies)=1, "error. More than one studies are found" )',
    "fixfunction": '$~> |$.investigation | {"studies" : [$.studies[0]]} |'
  },
  {
    "description": "Checking if all investigation.studies.materials.sources have at least one characteristic",
    "jsonata": '$assert($count($.investigation.studies.materials.sources[$lookup("characteristics")]) = $count($.investigation.studies.materials.sources), "Not all sources in materials have characteristics ")',
    "fixfunction": '$~>|  $.investigation.studies.materials| {"sources" : sources[$lookup("characteristics")] }  |'

  }, {
    "description": "To evaluate the type of the \"value\" key, try to auto-fix if the value is a number or a string",
    "jsonata": '$assert(($nopeople := $ ~> |$.investigation.studies[0]| {"people":[]} |; $not($exists($nopeople.investigation.studies.**[($type(value) = "string") or ($type(value) = "number")]))), "error, the strings or numbers type of value exist in the values")',
    "error": "string and number values exist in the 'value' keys",
    "fixfunction": '($people := $.investigation.studies.people ;$c1 := $ ~> | $.investigation.studies.**[($type(value) = "string") or ($type(value) = "number") ] | { "value": {"@id": "","annotationValue": value.$string(), "termAccession":"", "termSource":"" } }| ;  $c1 ~> | $.investigation.studies| {"people" : $people} | )'
  }, {
    "description": "Checking if all investigation.studies.materials.sources.characteristics.category have the correct format",
    "jsonata": '($p := $.investigation.studies.materials.sources.characteristics; $assert( $count($p) = $count($p.category) , "Some characteristics do not have categories" ))',
    "fixfunction": '($dic := $.investigation.studies.materials.sources.characteristics[$lookup("value")]{ `@id` : category}; $getvalue := function($id){($dic.$lookup($id))}; $ ~> |$.investigation.studies.materials.sources.characteristics| {"category": `@id`.$getvalue($) }| )'
  },
  {
    "description": "Checking investigation.studies.materials.sources.characteristics.value ",
    "jsonata": '($p := $.investigation.studies.materials.sources.characteristics[[$contains(`@id`, "Empty" ).$not()]]; $assert( $count($p) = $count($p.value) , "Some characteristics do not have values" ))',
    "fixfunction": '($dic := $.investigation.studies.materials.sources.characteristics[$lookup("value")]{ `@id` : value};$getvalue := function($id){($dic.$lookup($id))}; $ ~> |$.investigation.studies.materials.sources.characteristics| {"value": `@id`.$getvalue($) }| )'
  }
]

var checklist_ena = [
  {
    "description": "evaluate the type of the \"value\" key, and try to auto-fix if the value is ",
    "jsonata": '$assert($.studies.**[($type(value) = "string") or ($type(value) = "number")], "error")',
    "error": "string and number values exist in the 'value' keys",
    "fixfunction": '$ ~> | $.investigation.studies.**[($type(value) = "string") or ($type(value) = "number") ] | { "value": {"@id": "","annotationValue": value.$string(), "termAccession":"", "termSource":"" } }|'
  }
]