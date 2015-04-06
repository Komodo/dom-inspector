/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* RDFArray -----------------------------------------------
*  A convenience routine for creating an RDF-based 2d array 
*  indexed by number and hashkey.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
*   chrome://inspector/content/utils.js
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*   chrome://inspector/content/jsutil/rdf/RDFU.js
****************************************************************/

//////////// global constants ////////////////////

RDFArray.URI = "http://www.joehewitt.com/mozilla/util/RDFArray#";
RDFArray.RDF_URI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
  
///// class RDFArray /////////////////////////

function RDFArray(aNSURI, aRootURN, aArcName)
{
  this.mNSURI = aNSURI;
  this.mRootURN = aRootURN;
  this.mArcName = aArcName ? aArcName : "list";
}

RDFArray.prototype = {
  get datasource() { return this.mDS; },
  get length() { return this.mLength } ,
  
  initialize: function()
  {
    this.mLength = 0;
  
    this.mDS = XPCU.createInstance("@mozilla.org/rdf/datasource;1?name=in-memory-datasource", "nsIRDFDataSource");
  
    var root = gRDF.GetResource(this.mRootURN);
    var res = gRDF.GetAnonymousResource();
    this.mDS.Assert(root, gRDF.GetResource(this.mNSURI+this.mArcName), res, true);
  
    this.mSeq = gRDFCU.MakeSeq(this.mDS, res); 
  },

  add: function(aObject)
  {
    var res = this.createResourceFrom(aObject);
    this.addResource(res);
  },

  addResource: function(aResource)
  {
    this.mSeq.AppendElement(aResource);
    this.mLength++;
  },
  
  insertAt: function(aIndex, aObject)
  {
    var res = this.createResourceFrom(aObject);
    this.insertResourceAt(aIndex, res);
  },

  insertResourceAt: function(aIndex, aResource)
  {
  },

  removeAt: function(aIndex)
  {
    this.mSeq.RemoveElementAt(aIndex+1, true);
    this.mLength--;
  },
  
  removeById: function(aId)
  {
    var proj = gRDF.GetResource(aId);
    proj = XPCU.QI(proj, "nsIRDFNode");
    this.mSeq.RemoveElement(proj, true);
    this.mLength--;
  },
  
  get: function(aIndex, aKey)
  {
    var res = RDFU.getSeqElementAt(this.mSeq, aIndex);
    return RDFU.readAttribute(this.mDS, res, this.mNSURI+aKey);
  },
  
  set: function(aIndex, aKey, aValue)
  {
    var res = RDFU.getSeqElementAt(this.mSeq, aIndex);
    RDFU.writeAttribute(this.mDS, res, this.mNSURI+aKey, aValue);
  },
  
  getResource: function(aIndex)
  {
    return RDFU.getSeqElementAt(this.mSeq, aIndex);
  },

  getResourceId: function(aIndex)
  {
    var el = RDFU.getSeqElementAt(this.mSeq, aIndex);
    return el.Value;
  },

  save: function()
  {
    RDFU.saveDataSource(this.mDS);
  },


  clear: function()
  {
    while (this.mLength) {
      this.mSeq.RemoveElementAt(1, true);
      this.mLength--;
    }
  },

  createResourceFrom: function(aObject)
  {
    var el = gRDF.GetAnonymousResource();

    // add a literal node for each property being added
    for (var name in aObject) {
      this.mDS.Assert(el, gRDF.GetResource(this.mNSURI+name), gRDF.GetLiteral(aObject[name]), true);
    }
    
    return el;
  }

};

/////////// static factory methods /////////////////////////

RDFArray.fromContainer = function(aDS, aResourceID, aNSURI) 
{
  var list = new RDFArray(aNSURI);

  list.mDS = aDS;
  var seq = RDFU.findSeq(aDS, aResourceID);
  list.mSeq = seq;
  list.mLength = seq.GetCount();

  return list;
}

RDFArray.fromContainerArc = function(aDS, aSourceId, aTargetId, aNSURI) 
{
  var list = new RDFArray(aNSURI);
  list.mDS = aDS;

  var source = gRDF.GetResource(aSourceId);
  var target = gRDF.GetResource(aTargetId);
  var seqRes = aDS.GetTarget(source, target, true);

  var seq = RDFU.makeSeq(aDS, seqRes);
  list.mSeq = seq;
  list.mLength = seq.GetCount();

  return list;
}

