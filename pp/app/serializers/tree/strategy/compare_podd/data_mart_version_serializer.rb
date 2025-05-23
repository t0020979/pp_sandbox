# frozen_string_literal: true

class Tree::Strategy::ComparePodd::DataMartVersionSerializer < Tree::Strategy::DataMartVersionSerializer

  def text
    @object.data_mart.mnemonic.upcase
  end

  def load?
    @load ||= true
  end

  def type
    :attr_common
  end

  protected

  def element_serializer
    Tree::Strategy::ComparePodd::DataMartTableSerializer
  end
end
