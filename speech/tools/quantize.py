"""Makes model.matmul-int8.onnx: the full-precision model with only its matrix
multiplications stored as 8-bit integers.

The published int8 model also turns its convolutions into ConvInteger, which ONNX
Runtime runs slowly on Intel/AMD servers (Azure). Keeping the convolutions in full
precision avoids that while the big matrices still shrink to a quarter.

Needs: pip install onnx onnxruntime, and model.onnx + model.onnx_data from
https://huggingface.co/OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx (2.3 GB).
Run: python tools/quantize.py <folder with model.onnx> <output file>
"""

import sys

from onnxruntime.quantization import QuantType, quantize_dynamic

source, target = sys.argv[1], sys.argv[2]
quantize_dynamic(f"{source}/model.onnx", target, op_types_to_quantize=["MatMul"], weight_type=QuantType.QInt8)
print("wrote", target)
